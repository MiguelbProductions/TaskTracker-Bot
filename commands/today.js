const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('today')
        .setDescription('Mostra as tarefas para hoje'),

    async execute(interaction) {
        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user || user.tasks.length === 0) return interaction.reply('Você não tem tarefas registradas.');

        const today = new Date();
        const dayOfWeek = today.getDay();

        // Filtra as tarefas para o dia atual
        const todayTasks = user.tasks.filter(task => task.daysOfWeek.includes(dayOfWeek));

        if (todayTasks.length === 0) {
            return interaction.reply('Você não tem tarefas para hoje.');
        }

        // Cria embed com o estado das tarefas
        const embed = new EmbedBuilder()
            .setTitle('Tarefas de Hoje')
            .setDescription('Aqui estão as tarefas para hoje:')
            .setColor(0x00AE86);

        todayTasks.forEach(task => {
            const completedToday = task.completedDates.some(date => date.toDateString() === today.toDateString());
            const status = completedToday ? '✅' : '❌';
            embed.addFields({ name: `${task.name} (ID: ${task.taskId})`, value: `Status: ${status}`, inline: false });
        });

        await interaction.reply({ embeds: [embed] });
    },
};
