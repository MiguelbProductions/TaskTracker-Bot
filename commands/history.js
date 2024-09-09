const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('Mostra o histórico de tarefas completadas em uma data específica')
        .addStringOption(option =>
            option.setName('data')
                .setDescription('Data no formato YYYY-MM-DD')
                .setRequired(true)),

    async execute(interaction) {
        const dateInput = interaction.options.getString('data');
        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user || user.history.length === 0) return interaction.reply('Você não tem histórico registrado.');

        const date = new Date(dateInput);
        const historyEntry = user.history.find(entry => entry.date.toDateString() === date.toDateString());

        if (!historyEntry) {
            return interaction.reply(`Nenhum histórico encontrado para a data ${dateInput}.`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`Histórico de ${date.toDateString()}`)
            .setDescription(`Aqui estão as tarefas completadas e suas informações para o dia ${dateInput}`)
            .setColor(0x00AE86);

        historyEntry.completedTasks.forEach(taskId => {
            const task = user.tasks.find(t => t.taskId === taskId);
            if (task) {
                const status = task.completedDates.some(d => d.toDateString() === date.toDateString()) ? '✅' : '❌';
                embed.addFields({ name: task.name, value: `Status: ${status}`, inline: true });
            }
        });

        await interaction.reply({ embeds: [embed] });
    },
};