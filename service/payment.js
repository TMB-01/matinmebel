const {Payment} = require("../db/modules");
const {paymentType, paymentCategory} = require("../db/payment");
const payForGoods = async (req, res) => {

    const payload = req.body;
    const query = req.query;

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
                goodId: query?.id
            })
        }
    }
    res.send({msg: "Paid"})
}

const editPayment = async (req, res) => {
    const query = req.query;
    const id = query.id;
    const amount = query.price;
    // const currency = query.currency;
    const paymentMethod = query?.paymentMethod?.label;
    await Payment.update({
        amount,
        paymentMethod,
    }, {where: {id}})
    res.send({msg: "Updated"})
}

const deletePayment = async (req, res) => {
    const query = req.query;
    const id = query.id;
    await Payment.destroy({where: {id}});
    res.send({msg: "Deleted"})
}

module.exports = {payForGoods, editPayment, deletePayment}