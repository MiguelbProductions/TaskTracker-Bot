const mongoose = require('mongoose');

const generateTaskId = () => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
};

const taskSchema = new mongoose.Schema({
    taskId: { type: String, default: generateTaskId },
    name: String,
    daysOfWeek: [Number],
    completedDates: [Date],
    streak: { type: Number, default: 0 },
    lastCompleted: Date
});

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true },
    tasks: [taskSchema],
    history: [{
        date: { type: Date, required: true },
        completedTasks: [String]
    }]
});

module.exports = mongoose.model('User', userSchema);