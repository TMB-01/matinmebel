const {Goods, RawMaterial, Files, GoodsMaterialAmount, Payment} = require("../db/modules");
const {paymentType, paymentCategory} = require("../db/payment");
const getGoods = async (req, res) => {
    Goods.findAll({
        order: [
            ["id", "DESC"],
            [{model: Payment}, 'id', 'DESC'],
            [{model: GoodsMaterialAmount}, 'id', 'DESC'],
        ],
        include: [
            {
                model: Payment,
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
        description: payload?.description
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
        const currency = product?.currency?.label;
        const images = product?.images;

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
                        const file = await Files.create({base64});
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
                description: product?.description
            })
        }
        await RawMaterial.update({
            amount: materialData?.amount + amount,
        }, {
            where: {id: materialData?.id}
        });
        await GoodsMaterialAmount.create({
            amount,
            rawMaterialId: materialData?.id,
            goodId: goods?.id
        })
        // res.send({msg: "Saved"})
    }

    const payloadEntries = Object.entries(payload);
    for (let i = 0; i < payloadEntries.length; i++) {
        const [key, value] = payloadEntries[i];
        if (key.startsWith("price__")) {
            const [name, index, currency] = key.split("__");
            const paymentMethod = payload[`payment_method__${index}__${currency}`].value;
            await Payment.create({
                type: paymentType.EXPENSE,
                paymentMethod,
                amount: value,
                currency,
                category: paymentCategory.GOODS,
                goodId: goods.id
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
    const currency = product?.currency?.label;
    const images = product?.images;

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
                    const file = await Files.create({base64});
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
            description: product?.description
        })
    }
    await RawMaterial.update({
        amount: materialData?.amount + amount,
    }, {
        where: {id: materialData?.id}
    });
    await GoodsMaterialAmount.create({
        amount,
        rawMaterialId: materialData?.id,
        goodId: query?.id
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
    const currency = product?.currency?.label;
    const images = product?.images;

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
                    const file = await Files.create({base64});
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
            description: product?.description
        })
    }
    const goodsMaterialAmount = await GoodsMaterialAmount.findByPk(id);
    console.log(goodsMaterialAmount);
    const rawMaterial = await RawMaterial.findByPk(goodsMaterialAmount.rawMaterialId)
    console.log(rawMaterial);

    await RawMaterial.update({
        amount: rawMaterial?.amount - goodsMaterialAmount?.amount,
    }, {
        where: {id: goodsMaterialAmount?.rawMaterialId}
    });

    materialData = await RawMaterial.findByPk(materialData?.id)

    await RawMaterial.update({
        amount: materialData?.amount + amount,
    }, {
        where: {id: materialData?.id}
    });

    await GoodsMaterialAmount.update({
            amount,
            rawMaterialId: materialData?.id,
            // goodId: query?.id
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
        provider: body?.provider?.label
    }, {
        where: {id: query?.id}
    })
    res.send({msg: "Updated"})
}

const deleteMaterialOfGoods = async (req, res) => {
    const query = req.query;
    const goodsMaterialAmount = await GoodsMaterialAmount.findByPk(query?.id)
    const rawMaterial = await RawMaterial.findByPk(goodsMaterialAmount?.rawMaterialId);
    await RawMaterial.update({
        amount: rawMaterial.amount - goodsMaterialAmount.amount
    }, {
        where: {
            id: goodsMaterialAmount?.rawMaterialId
        }
    })
    await GoodsMaterialAmount.destroy({where: {id: query?.id}})
    res.send({msg: "Deleted"})
}

module.exports = {
    getGoods,
    getProviders,
    addGoods,
    addMaterialToGoods,
    editMaterialOfGoods,
    deleteMaterialOfGoods,
    editProviderOfGoods
}