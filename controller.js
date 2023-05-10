const express = require("express")
const {addMaterial, getWarehouse, editMaterial, changeMaterialActiveness} = require("./service/warehouse");
const cors = require("cors")
const {getFileById} = require("./service/files");
const {
    getGoods,
    addGoods,
    addMaterialToGoods,
    editMaterialOfGoods,
    deleteMaterialOfGoods,
    getProviders, editProviderOfGoods, getSingleGoods
} = require("./service/goods");
const {
    payForGoods,
    deletePayment,
    editPayment,
    addPaymentToOrder,
    paySalaryForOrder,
    getPayments, getPaymentCategory, addPayment, paySalary, getStaffSalary
} = require("./service/payment");
const {
    addOrder,
    getOrders,
    editOrderDetail,
    addOrderDetail,
    editOrderDetailPrice,
    editOrderClient, editOrderDescription, editOrderDetailStatus, getSingleOrder, closeOrder
} = require("./service/order");
const {getStaffList, addStaff, editStaff, editStaffActivation, getMe} = require("./service/staff");
const {getAccounts, addAccount, editAccount, editActivation} = require("./service/finAccount");
const {sendCode, validateCode, validateToken, authMiddleware, hasAccess} = require("./service/auth");
const {
    GET_MATERIALS,
    ADD_MATERIALS,
    EDIT_MATERIAL,
    GET_GOODS,
    ADD_GOODS,
    EDIT_GOODS, GET_PAYMENTS, ADD_PAYMENTS, PAY_FOR_GOODS, ADD_PAYMENT_TO_ORDER, EDIT_PAYMENT, DELETE_PAYMENT,
    PAY_SALARY_FOR_ORDER, PAY_SALARY, GET_STAFF_SALARY, GET_ACCOUNTS, ADD_ACCOUNT, EDIT_ACCOUNT, GET_ORDERS, ADD_ORDER,
    EDIT_ORDER, GET_STAFF_LIST, ADD_STAFF, EDIT_STAFF
} = require("./constants/permissions");
require("dotenv").config();


const app = express();
// app.use(express.json());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(cors());
const port = process.env.PORT;
app.use(authMiddleware());


app.get("/", (req, res) => {
    res.send({data: "Hello World"})
})

app.get("/warehouse/materials", hasAccess(GET_MATERIALS), getWarehouse);
app.post("/warehouse/material", hasAccess(ADD_MATERIALS), addMaterial);
app.put("/warehouse/material", hasAccess(EDIT_MATERIAL), editMaterial);
app.put("/warehouse/material/activeness", hasAccess(EDIT_MATERIAL), changeMaterialActiveness);

app.get("/warehouse/goods", hasAccess(GET_GOODS), getGoods);
app.get("/warehouse/single/goods", hasAccess(GET_GOODS), getSingleGoods);
app.get("/warehouse/providers", hasAccess(GET_GOODS), getProviders);
app.post("/warehouse/goods", hasAccess(ADD_GOODS), addGoods);
app.post("/warehouse/add-material-to-goods", hasAccess(EDIT_GOODS), addMaterialToGoods);
app.put("/warehouse/edit-material-of-goods", hasAccess(EDIT_GOODS), editMaterialOfGoods);
app.put("/warehouse/edit-provider-of-goods", hasAccess(EDIT_GOODS), editProviderOfGoods);
app.delete("/warehouse/delete-material-of-goods", hasAccess(EDIT_GOODS), deleteMaterialOfGoods);

app.get("/payments", hasAccess(GET_PAYMENTS), getPayments);
app.post("/payment", hasAccess(ADD_PAYMENTS), addPayment);
app.post("/payment/goods", hasAccess(PAY_FOR_GOODS), payForGoods);
app.post("/payment/order", hasAccess(ADD_PAYMENT_TO_ORDER), addPaymentToOrder);
app.put("/payment", hasAccess(EDIT_PAYMENT), editPayment);
app.delete("/payment", hasAccess(DELETE_PAYMENT), deletePayment);
app.post("/payment/pay-salary-for-order", hasAccess(PAY_SALARY_FOR_ORDER), paySalaryForOrder)
app.post("/payment/pay-salary", hasAccess(PAY_SALARY), paySalary);
app.get("/payment/salaries", hasAccess(GET_STAFF_SALARY), getStaffSalary);
app.get("/payment/categories", getPaymentCategory);

// FINANCE ACCOUNT
app.get("/fin-account", hasAccess(GET_ACCOUNTS), getAccounts);
app.post("/fin-account", hasAccess(ADD_ACCOUNT), addAccount);
app.put("/fin-account", hasAccess(EDIT_ACCOUNT), editAccount);
app.put("/fin-account/activation", hasAccess(EDIT_ACCOUNT), editActivation);

app.get("/order", hasAccess(GET_ORDERS), getOrders);
app.get("/order/single", hasAccess(GET_ORDERS), getSingleOrder);
app.post("/order", hasAccess(ADD_ORDER), addOrder);
app.put("/order/close", hasAccess(EDIT_ORDER), closeOrder);

app.post("/order/order-detail", hasAccess(EDIT_ORDER), addOrderDetail);
app.put("/order/order-detail", hasAccess(EDIT_ORDER), editOrderDetail);

app.put("/order/order-detail/price", hasAccess(EDIT_ORDER), editOrderDetailPrice);
app.put("/order/order-detail/status", hasAccess(EDIT_ORDER), editOrderDetailStatus);
app.put("/order/client", hasAccess(EDIT_ORDER), editOrderClient);
app.put("/order/description", hasAccess(EDIT_ORDER), editOrderDescription);

app.get("/staff", hasAccess(GET_STAFF_LIST), getStaffList);
app.get("/staff/me", getMe);
app.post("/staff", hasAccess(ADD_STAFF), addStaff);
app.put("/staff", hasAccess(EDIT_STAFF), editStaff);
app.put("/staff/activation", hasAccess(EDIT_STAFF), editStaffActivation);

//AUTH
app.get("/auth/send-code", sendCode);
app.get("/auth/validate-code", validateCode);

app.get("/files/:id", getFileById);

const startServer = async () => {
    app.listen(port, () => {
        console.log(`App listening on port ${port}`)
    })
}

module.exports = {app, startServer};