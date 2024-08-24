const { SlashCommandBuilder } = require('discord.js');
const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    userId: String,
    time: String, 
});

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setreminder')
        .setDescription('Set the time for your daily task reminders.')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time for the reminder (HH:mm in 24-hour format)')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const time = interaction.options.getString('time');

        const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(time)) {
            return interaction.reply({ content: 'Please enter a valid time in HH:mm format (24-hour).', ephemeral: true });
        }

        let reminder = await Reminder.findOne({ userId });
        if (!reminder) {
            reminder = new Reminder({ userId, time });
        } else {
            reminder.time = time;
        }

        await reminder.save();
        return interaction.reply({ content: `Your reminder time has been set to ${time}.`, ephemeral: true });
    },
};
