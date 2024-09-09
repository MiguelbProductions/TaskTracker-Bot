const { SlashCommandBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modifytask')
        .setDescription('Modifica os dias de uma tarefa existente')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID da tarefa a ser modificada')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('dias')
                .setDescription('Novos dias da semana (0-6, separados por vírgulas)')
                .setRequired(true)),

    async execute(interaction) {
        const taskId = interaction.options.getString('id');
        const newDays = interaction.options.getString('dias').split(',').map(Number);

        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user) return interaction.reply('Você não tem tarefas registradas.');

        const task = user.tasks.find(t => t.taskId === taskId);
        if (!task) return interaction.reply('Tarefa não encontrada.');

        task.daysOfWeek = newDays;
        await user.save();

        await interaction.reply(`Tarefa com ID \`${taskId}\` teve os dias modificados para: ${newDays.join(', ')}`);
    },
};