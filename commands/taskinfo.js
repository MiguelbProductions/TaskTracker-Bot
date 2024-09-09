const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../models/User');

const daysOfWeekMap = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('taskinfo')
        .setDescription('Exibe informações detalhadas de uma tarefa')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID da tarefa')
                .setRequired(true)),

    async execute(interaction) {
        const taskId = interaction.options.getString('id');
        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user) return interaction.reply('Você não tem tarefas registradas.');

        const task = user.tasks.find(t => t.taskId === taskId);
        if (!task) return interaction.reply('Tarefa não encontrada.');

        // Convertendo os dias da semana para nomes
        const daysOfWeekText = task.daysOfWeek.map(day => daysOfWeekMap[day]);

        const embed = new EmbedBuilder()
            .setTitle(`Informações da Tarefa: ${task.name}`)
            .setDescription(`ID da Tarefa: \`${taskId}\``)
            .addFields(
                { name: 'Dias da Semana', value: daysOfWeekText.join(', '), inline: true },
                { name: 'Streak Atual', value: `${task.streak} dias`, inline: true }
            )
            .setColor(0x00AE86);

        await interaction.reply({ embeds: [embed] });
    },
};