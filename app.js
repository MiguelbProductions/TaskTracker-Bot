require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectado ao MongoDB'))
    .catch(err => console.error('Erro ao conectar ao MongoDB', err));

const taskSchema = new mongoose.Schema({
    userId: String,
    task: String,
    completed: Boolean,
    date: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.content.startsWith('/addtask')) {
        const taskContent = message.content.replace('/addtask ', '');
        const newTask = new Task({ userId: message.author.id, task: taskContent, completed: false });

        await newTask.save();
        message.channel.send(`Tarefa "${taskContent}" adicionada com sucesso!`);
    }

    if (message.content === '/listtasks') {
        const tasks = await Task.find({ userId: message.author.id, completed: false });
        if (tasks.length > 0) {
            message.channel.send(`Suas tarefas:\n${tasks.map(t => `- ${t.task}`).join('\n')}`);
        } else {
            message.channel.send('Você não tem tarefas pendentes.');
        }
    }

    if (message.content.startsWith('/completetask')) {
        const taskContent = message.content.replace('/completetask ', '');
        const task = await Task.findOneAndUpdate({ userId: message.author.id, task: taskContent }, { completed: true });

        if (task) {
            message.channel.send(`Tarefa "${taskContent}" marcada como completa!`);
        } else {
            message.channel.send(`Tarefa "${taskContent}" não encontrada.`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
