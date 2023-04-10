const {RawMaterial, Files} = require("../db/modules")
const {deleteFileById} = require("./files");

const getWarehouse = async (req, res) => {
    RawMaterial.findAll({order: [["id", "DESC"]], where: {isActive: true}})
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
    currency = currency?.label;
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
                const file = await Files.create({base64});
                imagesUUIDs.push(file?.id);
            }
        }
    }

    const existMaterial = await RawMaterial.findOne({
        where: {
            name,
            isActive: true,
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
                description
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
            description
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
    currency = currency?.label;
    category = category?.label;

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
    const findMaterial = await RawMaterial.findByPk(query.id)

    const imagesList = findMaterial?.images?.split(",").filter(f => f);
    if (imagesList?.length) {
        imagesList.forEach((imgId) => {
            if (!imagesUUIDs.includes(imgId)) {
                deleteFileById(imgId)
            }
        })
    }

    const existMaterial = await RawMaterial.findAll({where: {name, isActive: true}})

    if (existMaterial.filter(({id}) => id !== query.id).length) {
        const existSame = existMaterial.filter(({
                                                    id,
                                                    name: eName,
                                                    price: ePrice,
                                                    currency: eCurrency
                                                }) => id !== query?.id && Number(ePrice) === Number(price) && eCurrency === currency);
        if (!existSame.length) {
            await RawMaterial.update({
                name,
                images: imagesUUIDs.join(","),
                amount,
                measurement: measurement,
                price,
                currency,
                category,
                description
            }, {
                where: {id: query?.id}
            })
            await RawMaterial.update({
                // name,
                images: imagesUUIDs.join(","),
                // amount,
                measurement: measurement,
                // price,
                // currency,
                category,
                // description
            }, {
                where: {
                    // id: query?.id,
                    name
                }
            })
            res.send("Updated")
        } else {
            res.status(400).json({
                msg: "When name is exist price should be different"
            })
        }
    } else {
        await RawMaterial.update({
            name,
            images: imagesUUIDs.join(","),
            amount,
            measurement,
            price,
            currency,
            category,
            description
        }, {where: {id: query?.id}})
        res.send("Updated");
    }
}

const deleteMaterial = async (req, res) => {
    const id = req?.query?.id
    await RawMaterial.update({
        isActive: false
    }, {
        where: {id}
    })
        .then(() => {
            res.send({msg: "Deleted"})
        })
        .catch(() => {
            res.status(400).json({msg: "Something went wrong :("})
        })

}

module.exports = {getWarehouse, addMaterial, editMaterial, deleteMaterial}