const {
    Goods,
    RawMaterial,
    Files,
    GoodsMaterialAmount,
    Payment,
    FinAccount,
    createdBy,
    updatedBy
} = require("../db/modules");
const {paymentType, paymentCategory} = require("../constants/payment");
const {createPayment} = require("./payment");
const {addMaterialAmount, subtractMaterialAmount} = require("./warehouse");
const getGoods = async (req, res) => {
    Goods.findAll({
        order: [
            ["addedAt", "DESC"],
            [{model: Payment}, 'id', 'DESC'],
            [{model: GoodsMaterialAmount}, 'id', 'DESC'],
        ],
        include: [
            {
                model: Payment,
                include: [{model: FinAccount}]
            },
            {
                model: GoodsMaterialAmount,
                include: RawMaterial
            }
        ]
    })
        .then((r) => {
            res.send(r);
        })
        .catch((err) => {
            res.status(400).json({msg: "Something went wrong", err})
        })
}

const getSingleGoods = async (req, res) => {
    const id = req?.query?.id;
    Goods.findByPk(id, {
        order: [
            [{model: Payment}, 'id', 'DESC'],
            [{model: GoodsMaterialAmount}, 'id', 'DESC'],
        ],
        include: [
            {
                model: Payment,
                include: [{model: FinAccount}]
            },
            {
                model: GoodsMaterialAmount,
                include: RawMaterial
            }
        ]
    })
        .then((r) => {
            res.send(r);
        })
        .catch((err) => {
            res.status(400).json({msg: "Something went wrong", err})
        })
}

const getProviders = async (req, res) => {
    const providers = await Goods.findAll({
        attributes: ["provider"],
        group: "provider"
    })
    res.send(providers.map(({provider}) => provider));
}

const addGoods = async (req, res) => {
    const body = req.body;
    const productList = body?.productList;
    const payload = body?.payload;

    const goods = await Goods.create({
        provider: payload?.provider?.label,
        description: payload?.description,
        addedAt: payload?.addedAt || new Date(Date.now()),
        ...createdBy(req?.user?.id)
    })

    // amount:3
    // category: {label: 'category', value: 'category'}
    // currency: {label: 'UZS', value: 'UZS'}
    // description: "hi there"
    // images: [{…}]
    // measurement: {label: 'kv', value: 'kv'}
    // name: {label: 'new tavar', value: '7', data: {…}}
    // price: 2300
    for (let i = 0; i < productList.length; i++) {
        const product = productList[i];
        const name = product?.name;
        const amount = product?.amount;
        const price = product?.price;
        let currency = product?.currency;
        const images = product?.images;

        currency = typeof currency === "string" ? currency : currency?.label

        const nameData = name?.data;
        let materialData = null;
        if (nameData) {
            if (price !== nameData.price || currency !== nameData?.currency) {
                delete nameData.id;
                delete nameData.createdAt;
                delete nameData.updatedAt;
                materialData = await RawMaterial.create({
                    ...nameData,
                    amount: 0,
                    price,
                    currency,
                    ...createdBy(req?.user?.id)
                })
            } else {
                materialData = await RawMaterial.findByPk(nameData.id);
            }
        } else {
            const imagesUUIDs = [];
            if (images.length) {
                for (let i = 0; i < images.length; i++) {
                    const image = images[i];
                    const base64 = image.base64;
                    const uuid = image.uuid;
                    if (uuid) {
                        imagesUUIDs.push(uuid);
                    } else if (base64) {
                        const file = await Files.create({base64, ...createdBy(req?.user?.id)});
                        imagesUUIDs.push(file?.id);
                    }
                }
            }
            materialData = await RawMaterial.create({
                name: name?.label,
                images: imagesUUIDs.join(","),
                amount: 0,
                measurement: product?.measurement?.label,
                price,
                currency,
                category: product?.category?.label,
                description: product?.description,
                ...createdBy(req?.user?.id)
            })
        }

        await addMaterialAmount({id: materialData?.id, amount, ...updatedBy(req?.user?.id)})

        await GoodsMaterialAmount.create({
            amount,
            rawMaterialId: materialData?.id,
            goodId: goods?.id,
            ...createdBy(req?.user?.id)
        })
        // res.send({msg: "Saved"})
    }

    const payloadEntries = Object.entries(payload);
    for (let i = 0; i < payloadEntries.length; i++) {
        const [key, value] = payloadEntries[i];
        if (key.startsWith("price__")) {
            const [name, index, currency] = key.split("__");
            const finAccountId = payload[`fin_account__${index}__${currency}`];
            await createPayment({
                type: paymentType.EXPENSE,
                finAccountId,
                amount: value,
                // currency,
                category: paymentCategory.GOODS,
                goodId: goods.id,
                addedAt: payload?.addedAt || new Date(Date.now()),
            })
        }
    }
    res.send({msg: "Successfully saved"})
}

const addMaterialToGoods = async (req, res) => {
    const data = req.body;
    const query = req.query;
    const product = data;
    const name = product?.name;
    const amount = product?.amount;
    const price = product?.price;
    let currency = product?.currency;
    const images = product?.images;

    currency = typeof currency === "string" ? currency : currency?.label;

    const nameData = name?.data;
    let materialData = null;
    if (nameData) {
        if (price !== nameData.price || currency !== nameData?.currency) {
            delete nameData.id;
            delete nameData.createdAt;
            delete nameData.updatedAt;
            materialData = await RawMaterial.create({
                ...nameData,
                price,
                currency,
                ...createdBy(req?.user?.id)
            })
        } else {
            materialData = await RawMaterial.findByPk(nameData.id);
        }
    } else {
        const imagesUUIDs = [];
        if (images?.length) {
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const base64 = image.base64;
                const uuid = image.uuid;
                if (uuid) {
                    imagesUUIDs.push(uuid);
                } else if (base64) {
                    const file = await Files.create({base64, ...createdBy(req?.user?.id)});
                    imagesUUIDs.push(file?.id);
                }
            }
        }
        materialData = await RawMaterial.create({
            name: name?.label,
            images: imagesUUIDs.join(","),
            amount: 0,
            measurement: product?.measurement?.label,
            price,
            currency,
            category: product?.category?.label,
            description: product?.description,
            ...createdBy(req?.user?.id)
        })
    }

    await addMaterialAmount({id: materialData?.id, amount, ...updatedBy(req?.user?.id)})

    await GoodsMaterialAmount.create({
        amount,
        rawMaterialId: materialData?.id,
        goodId: query?.id,
        ...createdBy(req?.user?.id)
    })
    res.send({msg: "Saved"})
}

const editMaterialOfGoods = async (req, res) => {
    const data = req.body;
    const query = req.query;
    const product = data;
    const id = product?.id;
    const name = product?.name;
    const amount = product?.amount;
    const price = product?.price;
    let currency = product?.currency;
    const images = product?.images;

    currency = typeof currency === "string" ? currency : currency?.label;

    const nameData = name?.data;
    let materialData = null;
    if (nameData) {
        if (price !== nameData.price || currency !== nameData?.currency) {
            delete nameData.id;
            delete nameData.createdAt;
            delete nameData.updatedAt;
            materialData = await RawMaterial.create({
                ...nameData,
                price,
                currency,
                ...createdBy(req?.user?.id)
            })
        } else {
            materialData = await RawMaterial.findByPk(nameData.id);
        }
    } else {
        const imagesUUIDs = [];
        if (images?.length) {
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const base64 = image.base64;
                const uuid = image.uuid;
                if (uuid) {
                    imagesUUIDs.push(uuid);
                } else if (base64) {
                    const file = await Files.create({base64, ...createdBy(req?.user?.id)});
                    imagesUUIDs.push(file?.id);
                }
            }
        }
        materialData = await RawMaterial.create({
            name: name?.label,
            images: imagesUUIDs.join(","),
            amount: 0,
            measurement: product?.measurement?.label,
            price,
            currency,
            category: product?.category?.label,
            description: product?.description,
            ...createdBy(req?.user?.id)
        })
    }
    const goodsMaterialAmount = await GoodsMaterialAmount.findByPk(id);
    // console.log(goodsMaterialAmount);
    const rawMaterial = await RawMaterial.findByPk(goodsMaterialAmount.rawMaterialId)
    // console.log(rawMaterial);

    await subtractMaterialAmount({
        id: goodsMaterialAmount?.rawMaterialId,
        amount: goodsMaterialAmount?.amount, ...updatedBy(req?.user?.id)
    })

    materialData = await RawMaterial.findByPk(materialData?.id)

    await addMaterialAmount({id: materialData?.id, amount, ...updatedBy(req?.user?.id)})

    await GoodsMaterialAmount.update({
            amount,
            rawMaterialId: materialData?.id,
            // goodId: query?.id
            ...updatedBy(req?.user?.id)
        }, {
            where: {id}
        }
    )
    res.send({msg: "Updated"})
}

const editProviderOfGoods = async (req, res) => {
    const query = req.query;
    const body = req.body;
    await Goods.update({
        provider: body?.provider?.label,
        ...updatedBy(req?.user?.id)
    }, {
        where: {id: query?.id}
    })
    res.send({msg: "Updated"})
}

const editAddedAtOfGoods = async (req, res) => {
    const id = req?.query?.id;
    const addedAt = req?.body?.addedAt;
    await Goods.update({addedAt}, {where: {id}})
    res.send({msg: "Updated"})
}

const deleteMaterialOfGoods = async (req, res) => {
    const query = req.query;
    const goodsMaterialAmount = await GoodsMaterialAmount.findByPk(query?.id)

    await subtractMaterialAmount({
        id: goodsMaterialAmount?.rawMaterialId,
        amount: goodsMaterialAmount.amount, ...updatedBy(req?.user?.id)
    })
    await GoodsMaterialAmount.destroy({where: {id: query?.id}})
    res.send({msg: "Deleted"})
}

const updateGoodsAddedAt = async () => {
    const goods = await Goods.findAll();
    for (let i = 0; i < goods.length; i++) {
        const singleGoods = goods[i];
        await Goods.update({
            addedAt: singleGoods?.addedAt || singleGoods?.createdAt
        }, {where: {id: singleGoods?.id}})
    }
}

module.exports = {
    getGoods,
    getSingleGoods,
    getProviders,
    addGoods,
    addMaterialToGoods,
    editMaterialOfGoods,
    deleteMaterialOfGoods,
    editProviderOfGoods,
    editAddedAtOfGoods,
    updateGoodsAddedAt
}