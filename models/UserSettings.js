const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    reminderTime: { type: String, required: true }
});

module.exports = mongoose.model('UserSettings', userSettingsSchema);