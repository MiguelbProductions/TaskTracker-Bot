const { SlashCommandBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('completetask')
        .setDescription('Marca uma tarefa como concluída')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID da tarefa a ser concluída')
                .setRequired(true)),

    async execute(interaction) {
        const taskId = interaction.options.getString('id');
        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user) return interaction.reply('Você não tem tarefas registradas.');

        const task = user.tasks.find(t => t.taskId === taskId);
        if (!task) return interaction.reply('Tarefa não encontrada.');

        const today = new Date();
        const dayOfWeek = today.getDay();

        if (!task.daysOfWeek.includes(dayOfWeek)) {
            return interaction.reply('Essa tarefa não é necessária para hoje.');
        }

        if (task.completedDates.some(d => d.toDateString() === today.toDateString())) {
            return interaction.reply('Você já completou essa tarefa hoje.');
        }

        task.completedDates.push(today);

        const lastCompleted = task.lastCompleted ? new Date(task.lastCompleted) : null;
        const diffDays = lastCompleted ? Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24)) : 0;

        if (lastCompleted && diffDays === 1) {
            task.streak += 1;
        } else {
            task.streak = 1;
        }

        task.lastCompleted = today;

        const historyEntry = user.history.find(entry => entry.date.toDateString() === today.toDateString());
        if (historyEntry) {
            historyEntry.completedTasks.push(taskId);
        } else {
            user.history.push({ date: today, completedTasks: [taskId] });
        }

        await user.save();
        await interaction.reply(`Tarefa com ID \`${taskId}\` concluída! Streak: ${task.streak} dias.`);
    },
};