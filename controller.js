const express = require("express")
const {addMaterial, getWarehouse, editMaterial, deleteMaterial} = require("./service/warehouse");
const cors = require("cors")
const {getFileById} = require("./service/files");
const {
    getGoods,
    addGoods,
    addMaterialToGoods,
    editMaterialOfGoods,
    deleteMaterialOfGoods,
    getProviders, editProviderOfGoods
} = require("./service/goods");
const {payForGoods, deletePayment, editPayment} = require("./service/payment");
require("dotenv").config();


const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT

app.get("/", (req, res) => {
    res.send({data: "Hello World"})
})

app.get("/warehouse/materials", getWarehouse);
app.post("/warehouse/material", addMaterial);
app.put("/warehouse/material", editMaterial);
app.delete("/warehouse/material", deleteMaterial);

app.get("/warehouse/goods", getGoods);
app.get("/warehouse/providers", getProviders);
app.post("/warehouse/goods", addGoods);
app.post("/warehouse/add-material-to-goods", addMaterialToGoods);
app.put("/warehouse/edit-material-of-goods", editMaterialOfGoods);
app.put("/warehouse/edit-provider-of-goods", editProviderOfGoods);
app.delete("/warehouse/delete-material-of-goods", deleteMaterialOfGoods);

app.post("/payment/goods", payForGoods)
app.put("/payment", editPayment)
app.delete("/payment", deletePayment)


app.get("/files/:id", getFileById)

const startServer = async () => {
    app.listen(port, () => {
        console.log(`App listening on port ${port}`)
    })
}

module.exports = {app, startServer};