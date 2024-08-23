const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: String,
    description: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);