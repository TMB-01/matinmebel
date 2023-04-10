const {sequelize} = require("./db");
const {DataTypes} = require("sequelize");

const id = {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
}

const Client = sequelize.define("client", {
    id,
    fullName: {
        type: DataTypes.STRING,
    },
    phoneNumber: {
        type: DataTypes.STRING,
    },
})

const Order = sequelize.define("orderData", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.TEXT,
    },
    description: {
        type: DataTypes.TEXT,
    },
    address: {
        type: DataTypes.TEXT,
    }
})

Client.hasMany(Order);
Order.belongsTo(Client);

const Staff = sequelize.define("staff", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    fullName: {
        type: DataTypes.TEXT,
    },
    description: {
        type: DataTypes.TEXT,
    }
})

const RawMaterial = sequelize.define("raw_material", {
    id,
    name: {
        type: DataTypes.STRING,
    },
    images: {
        type: DataTypes.TEXT,
    },
    amount: {
        type: DataTypes.FLOAT,
    },
    measurement: {
        type: DataTypes.STRING,
    },
    price: {
        type: DataTypes.FLOAT,
    },
    currency: {
        type: DataTypes.STRING,
    },
    category: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.TEXT
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }

})

const GoodsMaterialAmount = sequelize.define("goods_material_amount", {
    amount: {
        type: DataTypes.FLOAT
    }
})

RawMaterial.hasMany(GoodsMaterialAmount)
GoodsMaterialAmount.belongsTo(RawMaterial)

const Goods = sequelize.define("goods", {
    id,
    provider: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.TEXT,
    }

})

Goods.hasMany(GoodsMaterialAmount);
GoodsMaterialAmount.belongsTo(Goods);

const Warehouse = sequelize.define("warehouse", {id})

const Files = sequelize.define("files", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    base64: {
        type: DataTypes.TEXT
    },
    type: {
        type: DataTypes.STRING
    }
})

const Payment = sequelize.define("payment", {
    id,
    type: {
        type: DataTypes.STRING, // INCOME, EXPENSE
    },
    paymentMethod: {
        type: DataTypes.STRING,
    },
    amount: {
        type: DataTypes.FLOAT,
    },
    currency: {
        type: DataTypes.STRING,
    },
    category: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.STRING,
    }
})

Goods.hasMany(Payment);
Payment.belongsTo(Goods);

Staff.hasMany(Payment);
Payment.belongsTo(Staff);

Order.hasMany(Payment);
Payment.belongsTo(Order);

module.exports = {
    Client,
    Order,
    Staff,
    RawMaterial,
    GoodsMaterialAmount,
    Goods,
    Warehouse,
    Files,
    Payment,
}