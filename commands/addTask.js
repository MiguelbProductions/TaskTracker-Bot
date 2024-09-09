const { SlashCommandBuilder } = require('discord.js');
const User = require('../models/User');

const generateUniqueTaskId = async (user) => {
    let taskId;
    let idExists = true;
    
    while (idExists) {
        taskId = Math.random().toString(36).substr(2, 6).toUpperCase();
        idExists = user.tasks.some(task => task.taskId === taskId);
    }
    
    return taskId;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtask')
        .setDescription('Adiciona uma nova tarefa diária')
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('Nome da tarefa')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('dias')
                .setDescription('Dias da semana que a tarefa deve ser feita (0-6, separados por vírgulas)')
                .setRequired(true)),
        
    async execute(interaction) {
        const taskName = interaction.options.getString('nome');
        const daysOfWeek = interaction.options.getString('dias').split(',').map(Number);

        let user = await User.findOne({ discordId: interaction.user.id });
        if (!user) {
            user = new User({ discordId: interaction.user.id, tasks: [] });
        }

        const taskId = await generateUniqueTaskId(user);

        user.tasks.push({ taskId, name: taskName, daysOfWeek, completedDates: [], streak: 0 });
        await user.save();

        await interaction.reply(`Tarefa "${taskName}" adicionada com sucesso. ID da Tarefa: \`${taskId}\``);
    },
};