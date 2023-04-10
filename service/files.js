const {Files} = require("../db/modules");
const fs = require("fs");

function dataURLtoFile(dataurl, filename) {

    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, {type: mime});
}

const getFileById = async (req, res) => {
    const id = req.params.id;
    const file = await Files.findByPk(id);
    const buffer = Buffer.from(file.base64.split(';base64,').pop(), "base64")
    // const decodedFile = dataURLtoFile(file.base64, "image")
    res.send(buffer)
}

const deleteFileById = async (id) => {
    await Files.destroy({where: {id}});
    return id
}

module.exports = {getFileById, deleteFileById}