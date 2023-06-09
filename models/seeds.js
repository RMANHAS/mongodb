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

//const schema = new mongoose.Schema({
//     app: mongoose.Schema.Types.ObjectId,
//     companyId: mongoose.Schema.Types.ObjectId,
//     branchId: mongoose.Schema.Types.ObjectId,
//     class: String,
//     title: String,
//     abbr: String,
//     parentId: [mongoose.Schema.Types.ObjectId],
//     others: Object,
//     status: String,
//     fraudParameters: Object,
//   }, { timestamps: true });


module.exports = mongoose.model('seeds', schema)