const {
    Order,
    OrderDetail,
    Files,
    UsedMaterial,
    Payment,
    RawMaterial,
    Staff,
    GoodsMaterialAmount, FinAccount, createdBy, updatedBy
} = require("../db/modules");
const {deleteFileById} = require("./files");
const {orderStatus} = require("../constants/orderStatus");

const {addMaterialAmount, subtractMaterialAmount} = require("./warehouse");
const {Op} = require("sequelize");

const getOrders = async (req, res) => {
    const query = req?.query;
    const isClosed = Boolean(query?.closed);
    const dateRange = query?.dateRange || [];
    const [start, end] = dateRange;
    const orders = await Order.findAll({
        order: [
            ["id", "DESC"],
            [{model: OrderDetail}, 'id', 'DESC'],
            // [{model: Payment}, 'id', 'DESC'],
        ],
        include: [
            {
                model: OrderDetail,
                include: [{model: UsedMaterial, include: [{model: RawMaterial}]}]
            }, {
                model: Payment,
                foreignKey: 'salaryForOrderId',
                as: 'salaries',
                include: [{model: Staff}, {model: FinAccount}]
            }, {
                model: Payment,
                foreignKey: 'paymentForOrderId',
                as: 'payments',
                include: [{model: FinAccount}]
            }
        ],
        where: {
            isClosed,
            ...(
                (start && end) ?
                    {createdAt: {[Op.gte]: start, [Op.lte]: end,}} :
                    {}
            )
        }
    })
    res.send(orders);
}

const getSingleOrder = async (req, res) => {
    const id = req?.query?.id;
    const order = await Order.findByPk(id, {
        include: [
            {
                model: OrderDetail,
                include: [{model: UsedMaterial, include: [{model: RawMaterial}]}]
            }, {
                model: Payment,
                foreignKey: 'salaryForOrderId',
                as: 'salaries',
                include: [{model: Staff}, {model: FinAccount}]
            }, {
                model: Payment,
                foreignKey: 'paymentForOrderId',
                as: 'payments',
                include: [{model: FinAccount}]
            }
        ]
    })
    res.send(order);
}

const addOrder = async (req, res) => {
    const order = req.body;
    const orderDetails = order?.orderDetails;
    const {fullname, phone_number, address, description} = order;

    const prices = Object.entries(order)
        .filter(([key, value]) => key.startsWith("currency"))
        .map(([key, currency]) => {
            return {
                currency,
                amount: order[`price__${key.split("__")[1]}`]
            }
        })

    const createdOrder = await Order.create({
        description,
        fullName: fullname,
        phoneNumber: phone_number,
        address: address,
        price: prices,
        ...createdBy(req?.user?.id)
    })
    for (let i = 0; i < orderDetails.length; i++) {
        const orderDetail = orderDetails[i];
        let {
            name,
            price,
            currency,
            deadline,
            description,
            images,
        } = orderDetail;
        const imagesUUID = [];
        for (let j = 0; j < images.length; j++) {
            const image = images[j];
            const base64 = image.base64;
            const file = await Files.create({base64, ...createdBy(req?.user?.id)});
            imagesUUID.push(file.id);
        }

        const savedOrderDetail = await OrderDetail.create({
            images: imagesUUID.join(","),
            name,
            prices: [{price, currency}],
            deadline,
            description,
            orderDatumId: createdOrder?.id,
            ...createdBy(req?.user?.id)
        });

        const usedMaterials = Object.entries(orderDetail).filter(([key, value]) => (key.startsWith("used_material")));
        for (let j = 0; j < usedMaterials.length; j++) {
            const [key, value] = usedMaterials[j];
            await UsedMaterial.create({
                amount: orderDetail[`amount__${key.split("__")[1]}`],
                orderDetailId: savedOrderDetail.id,
                rawMaterialId: value,
                ...createdBy(req?.user?.id)
            })
        }
    }

    res.send("saved")
}

const closeOrder = async (req, res) => {
    const id = req?.query?.id;
    const ordersDetail = await OrderDetail.findAll({where: {orderDatumId: id}});
    const doneList = ordersDetail.filter(({status}) => status === "DONE");
    if (ordersDetail.length === doneList.length) {
        await Order.update({
            isClosed: true,
            closedAt: new Date(Date.now()), ...updatedBy(req?.user?.id)
        }, {where: {id}});
        res.send({msg: "Updated"});
    } else {
        res.status(400).json({msg: "All orders should be done )"});
    }
}

const editOrderDetail = async (req, res) => {
    const orderDetail = req.body;
    const query = req.query;
    const id = query?.id;
    const name = orderDetail.name;
    const price = orderDetail?.price;
    const currency = orderDetail?.currency;
    const deadline = orderDetail?.deadline;
    const description = orderDetail?.description;

    const images = orderDetail.images;

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

    const findMaterial = await OrderDetail.findByPk(id);
    const imagesList = findMaterial?.images?.split(",").filter(f => f);
    if (imagesList?.length) {
        imagesList.forEach((imgId) => {
            if (!imagesUUIDs.includes(imgId)) {
                deleteFileById(imgId)
            }
        })
    }

    const used_materials = Object.entries(orderDetail).filter(([key]) => key.startsWith("used_material"));

    const status = [
        // orderStatus.CREATED,
        // orderStatus.STARTED,
        orderStatus.FINISHED,
        orderStatus.INSTALLED,
        orderStatus.DONE
    ]
    if (status.includes(findMaterial?.status)) {
        const used_materials_list = await UsedMaterial.findAll({
            where: {orderDetailId: id},
            include: [{model: RawMaterial}]
        });
        for (let i = 0; i < used_materials_list?.length; i++) {
            const used_material = used_materials_list[i];
            const amount = used_material.amount;
            const id = used_material.rawMaterialId;
            await addMaterialAmount({id, amount,...updatedBy(req?.user?.id)});
        }
    }
    await UsedMaterial.destroy({where: {orderDetailId: id}});

    for (let i = 0; i < used_materials.length; i++) {
        const [key, value] = used_materials[i];
        const index = key.split("__")[1];
        const amount = orderDetail[`amount__${index}`];
        await UsedMaterial.create({
            amount,
            orderDetailId: id,
            rawMaterialId: value,
            ...createdBy(req?.user?.id)
        })
        if (status.includes(findMaterial?.status)) {
            await subtractMaterialAmount({id: value, amount, ...updatedBy(req?.user?.id)});
        }
    }

    await OrderDetail.update({
        images: imagesUUIDs.join(","),
        name,
        prices: [{price, currency}],
        deadline,
        description,
        ...updatedBy(req?.user?.id)
    }, {where: {id}})

    res.send({msg: "Updated"})
}

const addOrderDetail = async (req, res) => {
    const orderDetail = req.body;
    const query = req.query;
    const orderId = query?.id;
    const name = orderDetail.name;
    const price = orderDetail?.price;
    const currency = orderDetail?.currency;
    const deadline = orderDetail?.deadline;
    const description = orderDetail?.description;

    const images = orderDetail.images;

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

    const savedOrderDetail = await OrderDetail.create({
        images: imagesUUIDs.join(","),
        name,
        prices: [{price, currency}],
        deadline,
        description,
        orderDatumId: orderId,
        ...createdBy(req?.user?.id)
    });

    const used_materials = Object.entries(orderDetail).filter(([key]) => key.startsWith("used_material"));
    // await UsedMaterial.destroy({where: {orderDetailId: id}});

    for (let i = 0; i < used_materials.length; i++) {
        const [key, value] = used_materials[i];
        const index = key.split("__")[1];
        const amount = orderDetail[`amount__${index}`];
        await UsedMaterial.create({
            amount,
            orderDetailId: savedOrderDetail?.id,
            rawMaterialId: value,
            ...createdBy(req?.user?.id)
        })
    }

    res.send({msg: "Updated"})
}

const editOrderDetailPrice = async (req, res) => {
    const query = req?.query;
    const id = query?.id;
    const priceData = req?.body;
    const currencies = Object.entries(priceData).filter(([key]) => key.startsWith("currency"));
    const prices = currencies.map(([key, currency]) => {
        const index = key.split("__")[1];
        const amount = priceData[`price__${index}`];
        return {
            amount,
            currency
        }
    })
    await Order.update({price: prices, ...updatedBy(req?.user?.id)}, {where: {id}});
    res.send({msg: "Updated"});
}


const editOrderClient = async (req, res) => {
    const body = req.body;
    const query = req.query;
    const fullName = body?.fullname;
    const phoneNumber = body?.phone_number;
    const address = body?.address;
    await Order.update({
        fullName,
        phoneNumber,
        address,
        ...updatedBy(req?.user?.id)
    }, {where: {id: query?.id}})
    res.send({msg: "Updated"})
}

const editOrderDescription = async (req, res) => {
    const body = req.body;
    const query = req.query;

    const description = body?.description;
    await Order.update({
        description,
        ...updatedBy(req?.user?.id)
    }, {where: {id: query?.id}})
    res.send({msg: "Updated"})
}

const nextStep = (status) => {
    const {CREATED, STARTED, FINISHED, INSTALLED, DONE} = orderStatus;
    const statuses = {
        [CREATED]: STARTED,
        [STARTED]: FINISHED,
        [FINISHED]: INSTALLED,
        [INSTALLED]: DONE,
    }
    const nextStatus = statuses[status] || DONE
    return {
        status: nextStatus,
        [`${nextStatus.toLowerCase()}At`]: new Date(Date.now())
    };
}

const editOrderDetailStatus = async (req, res) => {
    const orderDetailId = req?.query?.id;
    let orderDetail = await OrderDetail.findByPk(orderDetailId);
    let status = orderDetail.status;
    const step = nextStep(status);
    await OrderDetail.update({...step, ...updatedBy(req?.user?.id)}, {where: {id: orderDetailId}});
    if (step.status === orderStatus.FINISHED) {
        orderDetail = await OrderDetail.findByPk(orderDetailId, {
            include: [{
                model: UsedMaterial,
                include: [{model: RawMaterial}]
            }]
        })
        // console.log(orderDetail);
        const used_materials = orderDetail?.used_materials;
        for (let i = 0; i < used_materials.length; i++) {
            const used_material = used_materials[i];
            const amount = used_material.amount;
            const raw_material = used_material.raw_material;
            const materialId = raw_material?.id;

            await subtractMaterialAmount({id: materialId, amount, ...updatedBy(req?.user?.id)})
        }
    }
    res.send({msg: "Updated"});
}

module.exports = {
    getOrders,
    getSingleOrder,
    addOrder,
    closeOrder,
    addOrderDetail,
    editOrderDetail,
    editOrderDetailPrice,
    editOrderClient,
    editOrderDescription,
    editOrderDetailStatus
}