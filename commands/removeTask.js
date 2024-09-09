const { SlashCommandBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removetask')
        .setDescription('Remove uma tarefa')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID da tarefa a ser removida')
                .setRequired(true)),

    async execute(interaction) {
        const taskId = interaction.options.getString('id');
        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user) return interaction.reply('Você não tem tarefas registradas.');

        const taskIndex = user.tasks.findIndex(task => task.taskId === taskId);
        if (taskIndex === -1) return interaction.reply('Tarefa não encontrada.');

        user.tasks.splice(taskIndex, 1);
        await user.save();

        await interaction.reply(`Tarefa com ID \`${taskId}\` removida com sucesso.`);
    },
};