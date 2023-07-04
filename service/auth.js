const {Staff} = require("../db/modules");
const axios = require("axios");
const {randomIntBetween} = require("../utils/numberManager");
const jwt = require("jsonwebtoken")
const {sequelize} = require("../db/db");

const generateToken = (payload) => {
    const secretKey = process.env.JWT_SECRET_KEY;
    return jwt.sign(payload, secretKey);
}

const validateToken = (token) => {
    const secretKey = process.env.JWT_SECRET_KEY;
    try {
        return jwt.verify(token, secretKey);
    } catch (e) {
        console.log(e);
    }

}

const hasAccess = (permission) => (req, res, next) => {
    const permissions = req.user.permissions;
    const superAdmin = req.user.isSuperAdmin;
    if (permissions?.includes(permission) || superAdmin) {
        next();
    } else {
        res.status(403).send("You don't have access to this )");
    }
}

const sendCode = async (req, res) => {
    const query = req?.query;
    const phone_number = query?.phone_number;
    const staff = await Staff.findOne({where: {phone_number}});
    if (!staff) {
        res.status(403).send("User with this phone number is not exist :(")
    } else if (!staff?.tg_chat_id) {
        res.status(403).send("Telegram chatId is not connected to this account :(")
    } else if (!staff?.isActive) {
        res.status(403).send("Account is not active :(")
    } else {
        const botToken = process.env.TG_BOT_TOKEN;
        const randomNumber = randomIntBetween(100000, 999999)
        axios
            .get(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                params: {
                    text: `${randomNumber}`,
                    chat_id: staff?.tg_chat_id
                }
            })
            .then(async (r) => {
                res.send("Check telegram bot \nWe sent code");
                await Staff.update({code: randomNumber}, {where: {id: staff?.id}})
            })
            .catch((err) => {
                console.log(err);
                res.status(403).send("It seems you have not pressed /start in tg bot. Ask super admin about bot")
            })
    }
}

const validateCode = async (req, res) => {
    const query = req.query;
    if (!Object.keys(query).length) {
        res.status(403).send(`Please send code that we sent from tg-bot`);
        return;
    }
    const staff = await Staff.findOne({where: query});
    if (!staff) {
        await Staff.update({wrong_attempt: sequelize.literal("wrong_attempt + 1")}, {where: {phone_number: query?.phone_number}});
        const updatedStaff = await Staff.findOne({where: {phone_number: query?.phone_number}});
        const wrong_attempt = updatedStaff?.wrong_attempt;
        if (wrong_attempt >= 5) {
            res.status(403).send(`Code is not same as we sent to you via telegram\nYou used ${wrong_attempt} out of 5 attempt. You reached max attempt so your account is blocked. Please contact to super admin to unblock you account`);
            await Staff.update({
                isActive: false,
                deactivationReason: "Inactivated due to Max wrong attempt"
            }, {where: query?.phone_number});
        } else {
            res.status(403).send(`Code is not same as we sent to you via telegram\nYou used ${wrong_attempt} out of 5 attempt. When you reach max attempt your account will be blocked`);
        }
    } else {
        const {phone_number, tg_chat_id, role} = staff;
        await Staff.update({wrong_attempt: 0, code: null}, {where: {phone_number}});
        res.send({token: generateToken({phone_number, tg_chat_id, role})});
    }
}

const authMiddleware = () => async (req, res, next) => {
    const path = req?.path;
    const id = path.startsWith("/files/") ? path.split("/files/")[1] : "";
    const openPaths = [
        "/auth/send-code",
        "/auth/validate-code",
        `/files/${id}`,
        "/",
        "/update-added-at",
        // "/warehouse/search-item"
    ];
    if (!openPaths.includes(path)) {
        const authorization = req?.headers?.authorization;
        if (!authorization) {
            res.status(403).send();
        } else {
            const token = authorization.split(" ")[1];
            const tokenData = validateToken(token);

            if (tokenData) {
                const {phone_number, tg_chat_id, role} = tokenData;
                const staff = await Staff.findOne({
                    attributes: [
                        // "code",
                        // "createdAt",
                        "deactivationReason",
                        // "description",
                        "fullname",
                        "id",
                        // "isActive",
                        "isSuperAdmin",
                        "permissions",
                        "phone_number",
                        "role",
                        "tg_chat_id",
                        // "updatedAt",
                        // "wrong_attempt"
                    ],
                    where: {phone_number}
                });
                if (staff && staff?.tg_chat_id === tg_chat_id && staff?.role === role) {
                    req.user = staff;
                    next();
                } else {
                    res.status(403).send("Logout, then login again coz you data is changed");
                }
            } else {
                res.status(403).send("Invalid token");
            }
        }
    } else {
        next();
    }
}

module.exports = {sendCode, validateCode, validateToken, authMiddleware, hasAccess}