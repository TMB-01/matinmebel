const {FinAccount, createdBy, updatedBy} = require("../db/modules");
const {sequelize} = require("../db/db");

const getAccounts = async (req, res) => {
    const accounts = await FinAccount.findAll({order: [["id", "DESC"]]});
    res.send(accounts);
}

const addAccount = async (req, res) => {
    const body = req.body;
    const {name, currency: {label: currency}, payment_method: {label: payment_method}, description} = body
    await FinAccount.create({
        name,
        currency,
        paymentMethod: payment_method,
        description,
        amount: 0,
        ...createdBy(req?.user?.id)
    })
    res.send({msg: "Created"});
}

const editActivation = async (req, res) => {
    const isActive = req?.body?.isActive
    const id = req?.query?.id;
    await FinAccount.update({isActive, ...updatedBy(req?.user?.id)}, {where: {id}});
    res.send({msg: "Updated"});
}

const editAccount = async (req, res) => {
    const body = req.body;
    const query = req.query;
    const id = query?.id;
    const {name, currency: {label: currency}, payment_method: {label: paymentMethod}, description} = body
    await FinAccount.update({name, currency, paymentMethod, description,...updatedBy(req?.user?.id)}, {where: {id}})
    res.send({msg: "Updated"});
}

const addMoney = async ({id, amount,updatedBy}) => {
    return await FinAccount.update({
        amount: sequelize.literal(`amount + ${amount}`),
        updatedBy
    }, {where: {id}})
}

const subtractMoney = async ({id, amount,updatedBy}) => {
    return await FinAccount.update({
        amount: sequelize.literal(`amount - ${amount}`),
        updatedBy
    }, {where: {id}})
}

module.exports = {getAccounts, addAccount, editActivation, editAccount, addMoney, subtractMoney}