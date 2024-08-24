const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: String,
    description: String,
    scheduleType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom_days', 'bi_weekly'],
        required: true
    },
    daysOfWeek: [String],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);