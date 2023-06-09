const mongoose = require('mongoose');
const schema = new mongoose.Schema({

    app: {
        type: mongoose.Types.ObjectId
    },
    branchId: {
        type: mongoose.Types.ObjectId
    },
    companyId: {
        type: mongoose.Types.ObjectId
    },
    class: String,
    title: String,
    abbr: String,
    others: {},
    status: String,
    parentId: [mongoose.Schema.Types.ObjectId],
});
module.exports = mongoose.model('seeds', schema)