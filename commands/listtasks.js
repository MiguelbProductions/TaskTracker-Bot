const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../models/User');

// Função para mapear os dias da semana
const daysOfWeekMap = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
};

// Função para criar um embed de tarefas por página
const createTaskEmbed = (tasks, page, totalPages) => {
    const embed = new EmbedBuilder()
        .setTitle(`Lista de Tarefas (Página ${page + 1} de ${totalPages})`)
        .setColor(0x00AE86);

    tasks.forEach(task => {
        const daysOfWeekText = task.daysOfWeek.map(day => daysOfWeekMap[day]).join(', ');
        embed.addFields(
            { name: `${task.name} (ID: ${task.taskId})`, value: `Dias: ${daysOfWeekText}`, inline: false }
        );
    });

    return embed;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listtasks')
        .setDescription('Lista todas as suas tarefas com paginação'),

    async execute(interaction) {
        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user || user.tasks.length === 0) return interaction.reply('Você não tem tarefas registradas.');

        const tasksPerPage = 5;
        let page = 0;
        const totalPages = Math.ceil(user.tasks.length / tasksPerPage);

        // Cria embed para a primeira página
        const paginatedTasks = user.tasks.slice(page * tasksPerPage, (page + 1) * tasksPerPage);
        const embed = createTaskEmbed(paginatedTasks, page, totalPages);
        const message = await interaction.reply({ embeds: [embed], fetchReply: true });

        if (totalPages > 1) {
            await message.react('⬅️');
            await message.react('➡️');

            const filter = (reaction, user) => {
                return ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === interaction.user.id;
            };

            const collector = message.createReactionCollector({ filter, time: 60000 });

            collector.on('collect', async (reaction) => {
                if (reaction.emoji.name === '➡️' && page < totalPages - 1) {
                    page++;
                } else if (reaction.emoji.name === '⬅️' && page > 0) {
                    page--;
                }

                const paginatedTasks = user.tasks.slice(page * tasksPerPage, (page + 1) * tasksPerPage);
                const newEmbed = createTaskEmbed(paginatedTasks, page, totalPages);
                await message.edit({ embeds: [newEmbed] });

                await reaction.users.remove(interaction.user.id);  // Remove a reação do usuário para evitar múltiplas reações
            });
        }
    },
};
