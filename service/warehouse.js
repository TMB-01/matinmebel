const {RawMaterial, Files, UsedMaterial, OrderDetail, createdBy, updatedBy} = require("../db/modules")
const {deleteFileById} = require("./files");
const {Sequelize, Op} = require("sequelize");
const {sequelize} = require("../db/db");

const getWarehouse = async (req, res) => {
    RawMaterial.findAll({
        order: [["name", "DESC"], ["id", "DESC"]],
        include: [{
            model: UsedMaterial,
            attributes: ["amount"],
            include: [{
                model: OrderDetail,
                // attributes: ["status"],
                where: {status: ["CREATED", "STARTED"]}
            }],
            // where: {order_detail: {status: ["CREATED", "STARTED"]}}
        }]
    })
        .then((r) => {
            res.send(r)
        })
        .catch((err) => {
            res.status(400).body(err)
        })
}

const addMaterial = async (req, res) => {
    const body = req.body;
    let {
        name,
        images,
        amount,
        measurement,
        price,
        currency,
        category,
        description
    } = body;
    name = name?.label;
    measurement = measurement?.label;
    currency = typeof currency === "string" ? currency : currency?.label;
    category = category?.label;

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

    const existMaterial = await RawMaterial.findOne({
        where: {
            name,
            is_active: true,
        }
    })

    if (existMaterial) {
        if (existMaterial.name === name && (Number(existMaterial.price) !== Number(price) || existMaterial.currency !== currency)) {
            await RawMaterial.create({
                name,
                images: imagesUUIDs.join(","),
                amount,
                measurement: existMaterial.measurement,
                price,
                currency,
                category: existMaterial.category,
                description,
                ...createdBy(req?.user?.id)
            })
            res.send("Saved")
        } else {
            res.status(400).json({
                msg: "When name is exist price should be different"
            })
        }
    } else {
        await RawMaterial.create({
            name,
            images: imagesUUIDs.join(","),
            amount,
            measurement,
            price,
            currency,
            category,
            description,
            ...createdBy(req?.user?.id)
        })
        res.send("Saved");
    }


}

const editMaterial = async (req, res) => {
    const query = req.query;
    const body = req.body;
    let {
        name,
        images,
        amount,
        measurement,
        price,
        currency,
        category,
        description
    } = body;
    // name = name?.label;
    measurement = measurement?.label;
    currency = typeof currency === "string" ? currency : currency?.label;
    category = category?.label;

    const findMaterial = await RawMaterial.findByPk(query.id)

    const existMaterial = await RawMaterial.findAll({
        where: {
            id: {[Op.ne]: query?.id}, name, is_active: true
        }
    })

    if (existMaterial?.filter(({
                                   price: ePrice,
                                   currency: eCurrency
                               }) => Number(ePrice) === Number(price) && eCurrency === currency).length) {
        res.status(400).json({
            msg: "When name is exist price should be different"
        })
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

        const imagesList = findMaterial?.images?.split(",").filter(f => f);
        if (imagesList?.length) {
            imagesList.forEach((imgId) => {
                if (!imagesUUIDs.includes(imgId)) {
                    deleteFileById(imgId)
                }
            })
        }

        await RawMaterial.update({
            name,
            images: imagesUUIDs.join(","),
            // amount,
            measurement,
            price,
            currency,
            category,
            description,
            ...updatedBy(req?.user?.id)
        }, {where: {id: query?.id}})
        await RawMaterial.update({
            name,
            images: imagesUUIDs.join(","),
            // amount,
            measurement,
            // price,
            // currency,
            category,
            // description
            ...updatedBy(req?.user?.id)
        }, {
            where: {
                // id: query?.id,
                id: {[Op.ne]: query?.id},
                name: findMaterial?.name,
                is_active: true
            }
        })
        res.send("Updated");
    }
}

const changeMaterialActiveness = async (req, res) => {
    const id = req?.query?.id
    await RawMaterial.update({
        is_active: Sequelize.literal(`NOT is_active`),
        ...updatedBy(req?.user?.id)
    }, {
        where: {id}
    })
        .then(() => {
            res.send({msg: "Changed"})
        })
        .catch((err) => {
            res.status(400).json({msg: "Something went wrong :("})
        })

}

const addMaterialAmount = async ({id, amount, updatedBy}) => {
    return await RawMaterial.update({
        amount: sequelize.literal(`amount + ${amount}`),
        updatedBy
    }, {where: {id}});
}

const subtractMaterialAmount = async ({id, amount, updatedBy}) => {
    return await RawMaterial.update({
        amount: sequelize.literal(`amount - ${amount}`),
        updatedBy
    }, {where: {id}});
}

module.exports = {
    getWarehouse,
    addMaterial,
    editMaterial,
    changeMaterialActiveness,
    addMaterialAmount,
    subtractMaterialAmount
}