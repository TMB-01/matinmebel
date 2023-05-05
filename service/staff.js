const {Staff, createdBy, updatedBy} = require("../db/modules");
const getStaffList = async (req, res) => {
    const staffList = await Staff.findAll({order: [["id", "DESC"]]});
    res.send(staffList);
}

const getMe = (req, res) => {
    res.send(req.user);
}

const addStaff = async (req, res) => {
    const staff = req.body;
    // const {fullname, phone_number, role: {label: role}, description} = staff;
    const {fullname, phone_number, tg_chat_id, role: {label: role}, permissions, description} = staff;
    Staff.create({
        fullname,
        phone_number,
        tg_chat_id,
        role,
        permissions,
        description,
        ...createdBy(req?.user?.id)
    })
        .then(() => {
            res.send({msg: "Saved"})
        })
        .catch(() => {
            res.status(400).json({msg: "Something went wrong"})
        })
}

const editStaff = async (req, res) => {
    const staff = req.body;
    const id = req?.query?.id;
    const {fullname, phone_number, tg_chat_id, role: {label: role}, permissions, description} = staff;
    Staff.update({
        fullname,
        phone_number,
        tg_chat_id,
        role,
        permissions,
        description,
        ...updatedBy(req?.user?.id)
    }, {where: {id}})
        .then(() => {
            res.send({msg: "Update"});
        })
        .catch(() => {
            res.status(400).json({msg: "Something went wrong"});
        });
}

const editStaffActivation = async (req, res) => {
    const body = req.body;
    const query = req.query;
    const id = query.id;

    await Staff.update({isActive: body?.isActive,...updatedBy(req?.user?.id)}, {where: {id}})
    res.send({msg: "Updated"});
}

module.exports = {getStaffList, getMe, addStaff, editStaff, editStaffActivation}