const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Task = require('../models/Task');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tarefa')
        .setDescription('Gerenciar suas tarefas diárias.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adiciona uma nova tarefa.')
                .addStringOption(option =>
                    option.setName('descrição')
                        .setDescription('Descrição da tarefa')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove uma tarefa.')
                .addStringOption(option =>
                    option.setName('descrição')
                        .setDescription('Descrição da tarefa a ser removida')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('concluir')
                .setDescription('Marca uma tarefa como concluída.')
                .addStringOption(option =>
                    option.setName('descrição')
                        .setDescription('Descrição da tarefa a ser concluída')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('listar')
                .setDescription('Lista todas as suas tarefas.')),
    async execute(interaction) {
        const userId = interaction.user.id;

        if (interaction.options.getSubcommand() === 'add') {
            const description = interaction.options.getString('descrição');
            const task = new Task({ userId, description, completed: false });
            await task.save();

            return interaction.reply({ content: `Tarefa **${description}** adicionada com sucesso!`, ephemeral: true });

        } else if (interaction.options.getSubcommand() === 'remove') {
            const description = interaction.options.getString('descrição');
            await Task.findOneAndDelete({ userId, description });

            return interaction.reply({ content: `Tarefa **${description}** removida com sucesso!`, ephemeral: true });

        } else if (interaction.options.getSubcommand() === 'concluir') {
            const description = interaction.options.getString('descrição');
            const task = await Task.findOne({ userId, description });

            if (task) {
                task.completed = true;
                await task.save();

                return interaction.reply({ content: `Tarefa **${description}** marcada como concluída!`, ephemeral: true });
            } else {
                return interaction.reply({ content: `Tarefa **${description}** não encontrada!`, ephemeral: true });
            }

        } else if (interaction.options.getSubcommand() === 'listar') {
            const tasks = await Task.find({ userId });
            let taskList = tasks.map((task, index) => `${index + 1}. ${task.description} - ${task.completed ? '✅ Concluída' : '❌ Pendente'}`).join('\n');

            if (!taskList) taskList = 'Nenhuma tarefa encontrada.';

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('Suas Tarefas')
                .setDescription(taskList)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};