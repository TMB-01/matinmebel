const {Payment, FinAccount, createdBy, updatedBy, Goods} = require("../db/modules");
const {paymentType, paymentCategory} = require("../constants/payment");
const {subtractMoney, addMoney} = require("./finAccount");
const {Op} = require("sequelize");

const getPayments = async (req, res) => {
    const query = req.query;
    const dateRange = query?.dateRange;
    const [start, end] = dateRange;
    const payments = await Payment.findAll({
        include: [{model: FinAccount}],
        order: [["addedAt", "DESC"]],
        where: {
            addedAt: {[Op.gte]: start, [Op.lte]: end}
        }
    });
    res.send(payments);
}

const addPayment = async (req, res) => {
    const body = req.body
    await createPayment({...body, ...createdBy(req?.user?.id)})
    res.send({msg: "Created"});
}

const payForGoods = async (req, res) => {

    const payload = req.body;
    const query = req.query;

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
                goodId: query?.id,
                addedAt: payload?.addedAt || new Date(Date.now()),
                ...createdBy(req?.user?.id)
            })
        }
    }
    res.send({msg: "Paid"})
}

const addPaymentToOrder = async (req, res) => {
    const payload = req.body;
    const query = req.query;

    const payloadEntries = Object.entries(payload);
    for (let i = 0; i < payloadEntries.length; i++) {
        const [key, value] = payloadEntries[i];
        if (key.startsWith("price__")) {
            const [name, index, currency] = key.split("__");
            const finAccountId = payload[`fin_account__${index}__${currency}`];
            const description = payload[`description__${index}__${currency}`];

            await createPayment({
                type: paymentType.INCOME,
                finAccountId,
                amount: value,
                currency,
                description,
                category: paymentCategory.ORDER,
                paymentForOrderId: query?.id,
                addedAt: payload?.addedAt || new Date(Date.now()),
                ...createdBy(req?.user?.id)
            })

        }
    }
    res.send({msg: "Payment added"})
}

const editPayment = async (req, res) => {
    const query = req.query;
    const id = query?.id;
    const amount = query?.price;
    const category = query?.category;
    // const currency = query.currency;
    const finAccountId = query?.fin_account_id;
    const staffId = query?.staffId;
    const description = query?.description;
    const addedAt = query?.addedAt;
    const payment = await Payment.findByPk(id);
    const type = payment?.type;
    if (type === paymentType.INCOME) {
        await subtractMoney({id: finAccountId, amount: payment?.amount, ...updatedBy(req?.user?.id)});
        await addMoney({id: finAccountId, amount, ...updatedBy(req?.user?.id)});
    } else if (type === paymentType.EXPENSE) {
        await addMoney({id: finAccountId, amount: payment?.amount, ...updatedBy(req?.user?.id)});
        await subtractMoney({id: finAccountId, amount, ...updatedBy(req?.user?.id)});
    }
    await Payment.update({
        category,
        amount,
        // paymentMethod,
        finAccountId,
        staffId,
        description,
        addedAt,
        ...updatedBy(req?.user?.id)
    }, {where: {id}})
    res.send({msg: "Updated"})
}

const editAddedAtOfPayment = async (req, res) => {
    const id = req?.query?.id;
    const addedAt = req?.body?.addedAt;
    await Payment.update({addedAt}, {where: {id}})
    res.send({msg: "Updated"})
}

const deletePayment = async (req, res) => {
    const query = req.query;
    const id = query.id;
    const payment = await Payment.findByPk(id);
    const type = payment?.type;
    if (type === paymentType.INCOME) {
        await subtractMoney({id: payment?.finAccountId, amount: payment?.amount, ...updatedBy(req?.user?.id)})
    } else if (type === paymentType.EXPENSE) {
        await addMoney({id: payment?.finAccountId, amount: payment?.amount, ...updatedBy(req?.user?.id)});
    }
    await Payment.destroy({where: {id}});
    res.send({msg: "Deleted"})
}

const paySalaryForOrder = async (req, res) => {
    const body = req.body;
    const query = req.query;
    const id = query?.id;

    await createPayment({
        type: paymentType.EXPENSE,
        category: paymentCategory.SALARY,
        salaryForOrderId: id,
        ...body,
        amount: body?.price,
        // currency: body?.currency?.label,
        finAccountId: body?.fin_account_id,
        addedAt: body?.addedAt || new Date(Date.now()),
        ...createdBy(req?.user?.id)
    });

    res.send({msg: "Created"});
}

const paySalary = async (req, res) => {
    const body = req.body;

    await createPayment({
        type: paymentType.EXPENSE,
        category: paymentCategory.SALARY,
        ...body,
        ...createdBy(req?.user?.id)
    });

    res.send({msg: "Created"});
}

const createPayment = async (body) => {
    body.addedAt = body.addedAt || new Date(Date.now());
    await Payment.create(body);
    if (body?.type === paymentType.EXPENSE) {
        await subtractMoney({id: body?.finAccountId, amount: body?.amount, ...updatedBy(body?.createdBy)})
    } else if (body?.type === paymentType.INCOME) {
        await addMoney({id: body.finAccountId, amount: body?.amount, ...updatedBy(body?.createdBy)})
    }
    return "Created"
}

const getPaymentCategory = async (req, res) => {
    const categories = await Payment.findAll({
        attributes: ["category"],
        group: "category",
        where: {
            [Op.not]: {
                category: [
                    paymentCategory.SALARY,
                    paymentCategory.GOODS,
                    paymentCategory.ORDER
                ]
            }
        }
    });
    res.send(categories);
}

const getStaffSalary = async (req, res) => {
    const staffId = req?.query?.staffId;
    const dateRange = req?.query?.dateRange;
    const [start, end] = dateRange;
    const payments = await Payment.findAll({
        where: {
            staffId,
            category: paymentCategory.SALARY,
            addedAt: {[Op.gte]: start, [Op.lte]: end}
        },
        include: [{model: FinAccount}]
    })
    res.send(payments);
}

const updatePaymentsAddedAt = async () => {
    const payments = await Payment.findAll();
    for (let i = 0; i < payments.length; i++) {
        const payment = payments[i];
        await Payment.update({
            addedAt: payment?.addedAt || payment?.createdAt
        }, {where: {id: payment?.id}})
    }
}

module.exports = {
    getPayments,
    addPayment,
    payForGoods,
    addPaymentToOrder,
    editPayment,
    editAddedAtOfPayment,
    deletePayment,
    paySalaryForOrder,
    paySalary,
    createPayment,
    getPaymentCategory,
    getStaffSalary,
    updatePaymentsAddedAt
}