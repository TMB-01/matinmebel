const {sequelize} = require("./db");
const {DataTypes} = require("sequelize");
const filesType = require("../constants/filesType")
const {orderStatus} = require("../constants/orderStatus");
const id = {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
}

const by = {
    createdBy: {
        type: DataTypes.BIGINT,
    },
    updatedBy: {
        type: DataTypes.BIGINT,
    }
}

const createdBy = (id) => ({
    createdBy: id,
})

const updatedBy = (id) => ({
    updatedBy: id,
})


//GENERAL

// const Client = sequelize.define("client", {
//     id,
//     fullName: {
//         type: DataTypes.STRING,
//     },
//     phoneNumber: {
//         type: DataTypes.STRING,
//     },
//     description: {
//         type: DataTypes.TEXT
//     }
// })

const Staff = sequelize.define("staff", {
    id,
    fullname: {
        type: DataTypes.TEXT,
    },
    phone_number: {
        type: DataTypes.STRING,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
    },
    role: {
        type: DataTypes.STRING
    },
    permissions: {
        type: DataTypes.JSONB,
    },
    tg_chat_id: {
        type: DataTypes.STRING,
    },
    // password: {
    //     type: DataTypes.STRING,
    // },
    wrong_attempt: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    deactivationReason: {
        type: DataTypes.TEXT
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    isSuperAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    code: {
        type: DataTypes.STRING
    },
    ...by
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
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    ...by
});

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
        type: DataTypes.STRING,
        defaultValue: filesType.IMAGE
    },
    ...by
})

const Payment = sequelize.define("payment", {
    id,
    type: {
        type: DataTypes.STRING, // INCOME, EXPENSE
    },
    // paymentMethod: {
    //     type: DataTypes.STRING,
    // },
    amount: {
        type: DataTypes.FLOAT,
    },
    // currency: {
    //     type: DataTypes.STRING,
    // },
    category: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.STRING,
    },
    ...by
})

//ORDER

const Order = sequelize.define("order_data", {
    id,
    // name: {
    //     type: DataTypes.TEXT,
    // },
    description: {
        type: DataTypes.TEXT,
    },
    fullName: {
        type: DataTypes.STRING,
    },
    phoneNumber: {
        type: DataTypes.STRING,
    },
    address: {
        type: DataTypes.TEXT,
    },
    // deadline: {
    //     type: DataTypes.DATE
    // }
    price: {
        type: DataTypes.JSONB
    },
    isClosed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    closedAt: {
        type: DataTypes.DATE,
    },
    ...by
})

// Client.hasMany(Order);
// Order.belongsTo(Client);

const OrderDetail = sequelize.define("order_detail", {
    id,
    images: {
        type: DataTypes.TEXT
    },
    name: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.STRING, // CREATED, STARTED, FINISHED, INSTALLED
        defaultValue: orderStatus.CREATED
    },
    prices: {
        type: DataTypes.JSONB
    },
    startedAt: {
        type: DataTypes.DATE
    },
    finishedAt: {
        type: DataTypes.DATE
    },
    installedAt: {
        type: DataTypes.DATE
    },
    doneAt: {
        type: DataTypes.DATE
    },
    deadline: {
        type: DataTypes.DATE
    },
    description: {
        type: DataTypes.TEXT
    },
    ...by
})

Order.hasMany(OrderDetail);
OrderDetail.belongsTo(Order);

const UsedMaterial = sequelize.define("used_material", {
    amount: {
        type: DataTypes.FLOAT,
    },
    ...by
})

OrderDetail.hasMany(UsedMaterial);
UsedMaterial.belongsTo(OrderDetail);

RawMaterial.hasMany(UsedMaterial);
UsedMaterial.belongsTo(RawMaterial);

/*salary*/
Staff.hasMany(Payment);
Payment.belongsTo(Staff);

Order.hasMany(Payment,
    // {as: "salaries"}
    {
        foreignKey: 'salaryForOrderId',
        constraints: false,
        as: "salaries"
        // scope: {
        //     commentableType: 'order'
        // }
    }
);
Payment.belongsTo(Order,
    // {as: "salary_for_order"}
    {foreignKey: 'salaryForOrderId', constraints: false, as: "salary_for_order"}
);

/*income*/
Order.hasMany(Payment,
    // {as: "payments"}
    {
        foreignKey: 'paymentForOrderId',
        constraints: false,
        as: "payments"
        // scope: {
        //     commentableType: 'order'
        // }
    }
);
Payment.belongsTo(Order,
    // {as: "payment_for_order"}
    {foreignKey: 'paymentForOrderId', constraints: false, as: "payment_for_order"}
);

// WAREHOUSE

const GoodsMaterialAmount = sequelize.define("goods_material_amount", {
    amount: {
        type: DataTypes.FLOAT
    },
    ...by
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
    },
    ...by

})

Goods.hasMany(GoodsMaterialAmount);
GoodsMaterialAmount.belongsTo(Goods);

Goods.hasMany(Payment);
Payment.belongsTo(Goods);

const Warehouse = sequelize.define("warehouse", {id})

const FinAccount = sequelize.define("fin_account", {
    id,
    name: {
        type: DataTypes.STRING,
    },
    currency: {
        type: DataTypes.STRING,
    },
    paymentMethod: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.TEXT,
    },
    amount: {
        type: DataTypes.FLOAT
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    ...by
})

FinAccount.hasMany(Payment);
Payment.belongsTo(FinAccount);

const createSuperAdmin = async () => {
    return await Staff.findOrCreate({
        where: {
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        },
        defaults: {
            fullname: "SUPER_ADMIN",
            // phone_number: process.env.PHONE_NUMBER,
            tg_chat_id: process.env.TG_CHAT_ID,
            description: "I'm super admin. I have super power",
            phone_number: "+998000000000"
        }
    })
}
module.exports = {
    // Client,
    Order,
    OrderDetail,
    UsedMaterial,
    Staff,
    RawMaterial,
    GoodsMaterialAmount,
    Goods,
    Warehouse,
    Files,
    Payment,
    FinAccount,
    createSuperAdmin,
    createdBy,
    updatedBy
}