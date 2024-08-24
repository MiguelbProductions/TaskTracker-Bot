const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Task = require('../models/Task');
const UserSettings = require('../models/UserSettings');
const schedule = require('node-schedule');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('task')
        .setDescription('Manage your tasks.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new task.')
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description of the task')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('schedule')
                        .setDescription('Choose the schedule for this task')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Daily', value: 'daily' },
                            { name: 'Weekly', value: 'weekly' },
                            { name: 'Monthly', value: 'monthly' },
                            { name: 'Custom Days', value: 'custom_days' },
                            { name: 'Bi-Weekly', value: 'bi_weekly' }
                        ))
                .addStringOption(option =>
                    option.setName('days')
                        .setDescription('Specify days for custom schedule (e.g., Monday, Wednesday)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a task.')
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description of the task to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all your tasks.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setremindertime')
                .setDescription('Set your reminder time.')
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Time for daily reminders (HH:mm in 24-hour format)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test your daily reminders.')),
    async execute(interaction) {
        const userId = interaction.user.id;

        if (interaction.options.getSubcommand() === 'add') {
            const description = interaction.options.getString('description');
            const scheduleType = interaction.options.getString('schedule');
            let daysOfWeek = [];

            if (scheduleType === 'custom_days') {
                const days = interaction.options.getString('days');
                if (days) {
                    daysOfWeek = days.split(',').map(day => day.trim());
                } else {
                    return interaction.reply({ content: 'Please specify the days for the custom schedule.', ephemeral: true });
                }
            }

            const task = new Task({
                userId,
                description,
                scheduleType,
                daysOfWeek
            });

            await task.save();

            return interaction.reply({ content: `Task **${description}** added successfully with a **${scheduleType}** schedule!`, ephemeral: true });

        } else if (interaction.options.getSubcommand() === 'remove') {
            const description = interaction.options.getString('description');
            await Task.findOneAndDelete({ userId, description });

            return interaction.reply({ content: `Task **${description}** removed successfully!`, ephemeral: true });

        } else if (interaction.options.getSubcommand() === 'list') {
            const tasks = await Task.find({ userId });

            if (!tasks.length) {
                return interaction.reply({ content: 'No tasks found.', ephemeral: true });
            }

            const taskList = tasks.map((task, index) => `${index + 1}. **${task.description}** - ${task.scheduleType}`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('Your Tasks')
                .setDescription(taskList)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (interaction.options.getSubcommand() === 'setremindertime') {
            const time = interaction.options.getString('time') || '08:00';
            const [hour, minute] = time.split(':').map(Number);

            if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                return interaction.reply({ content: 'Please provide a valid time in HH:mm format.', ephemeral: true });
            }

            let userSettings = await UserSettings.findOne({ userId });
            if (!userSettings) {
                userSettings = new UserSettings({ userId, reminderTime: time });
            } else {
                userSettings.reminderTime = time;
            }
            await userSettings.save();

            return interaction.reply({ content: `Your reminder time has been set to **${time}**.`, ephemeral: true });

        } else if (interaction.options.getSubcommand() === 'test') {
            await sendDailyReminder(interaction.client, userId);
            return interaction.reply({ content: 'Daily reminders test sent to your DM.', ephemeral: true });
        }
    },
};

async function sendDailyReminder(client, userId) {
    const tasks = await Task.find({ userId });
    if (!tasks.length) return;

    const today = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today];

    const dailyTasks = tasks.filter(task => {
        if (task.scheduleType === 'daily') return true;
        if (task.scheduleType === 'weekly' && today === 1) return true; // Monday
        if (task.scheduleType === 'bi_weekly' && task.lastNotified && ((new Date() - task.lastNotified) / (1000 * 60 * 60 * 24 * 7)) % 2 === 0) return true;
        if (task.scheduleType === 'monthly' && new Date().getDate() === 1) return true; // First day of the month
        if (task.scheduleType === 'custom_days' && task.daysOfWeek.includes(todayName)) return true;
        return false;
    });

    if (!dailyTasks.length) return;

    const user = await client.users.fetch(userId);
    const taskList = dailyTasks.map(task => `**${task.description}**`).join('\n');

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Your Tasks for Today')
        .setDescription(taskList)
        .setTimestamp();

    await user.send({ embeds: [embed] });

    dailyTasks.forEach(async task => {
        task.lastNotified = new Date();
        await task.save();
    });
}

async function scheduleDailyReminders(client) {
    try {
        const users = await UserSettings.find({});

        users.forEach(user => {
            const reminderTime = user.reminderTime || '08:00';
            const [hour, minute] = reminderTime.split(':').map(Number);
            const rule = new schedule.RecurrenceRule();
            rule.hour = hour;
            rule.minute = minute;
            rule.tz = 'UTC';

            schedule.scheduleJob(rule, async () => {
                await sendDailyReminder(client, user.userId);
            });
        });
    } catch (error) {
        console.error('Error scheduling daily reminders:', error);
    }
}
module.exports.scheduleDailyReminders = scheduleDailyReminders;