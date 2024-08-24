const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Note = require('../models/Note');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('note')
        .setDescription('Manage your notes.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new note.')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('The title of the note')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all notes.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View a specific note.')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('The title of the note to view')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a specific note.')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('The title of the note to edit')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('The new content for the note')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a specific note.')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('The title of the note to delete')
                        .setRequired(true))),
    async execute(interaction) {
        const userId = interaction.user.id;

        if (interaction.options.getSubcommand() === 'create') {
            const title = interaction.options.getString('title');
            const existingNote = await Note.findOne({ userId, title });

            if (existingNote) {
                return interaction.reply({ content: `A note with the title **${title}** already exists.`, ephemeral: true });
            }

            const note = new Note({
                userId,
                title,
                content: ''
            });

            await note.save();
            return interaction.reply({ content: `Note **${title}** created successfully!`, ephemeral: true });

        } else if (interaction.options.getSubcommand() === 'list') {
            const notes = await Note.find({ userId });

            if (!notes.length) {
                return interaction.reply({ content: 'No notes found.', ephemeral: true });
            }

            const noteList = notes.map((note, index) => `${index + 1}. **${note.title}**`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Your Notes')
                .setDescription(noteList)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (interaction.options.getSubcommand() === 'view') {
            const title = interaction.options.getString('title');
            const note = await Note.findOne({ userId, title });

            if (!note) {
                return interaction.reply({ content: `No note found with the title **${title}**.`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(note.title)
                .setDescription(note.content || 'This note is currently empty.')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (interaction.options.getSubcommand() === 'edit') {
            const title = interaction.options.getString('title');
            const newContent = interaction.options.getString('content');
            const note = await Note.findOne({ userId, title });

            if (!note) {
                return interaction.reply({ content: `No note found with the title **${title}**.`, ephemeral: true });
            }

            note.content = newContent;
            await note.save();

            return interaction.reply({ content: `Note **${title}** updated successfully!`, ephemeral: true });

        } else if (interaction.options.getSubcommand() === 'delete') {
            const title = interaction.options.getString('title');
            const note = await Note.findOneAndDelete({ userId, title });

            if (!note) {
                return interaction.reply({ content: `No note found with the title **${title}**.`, ephemeral: true });
            }

            return interaction.reply({ content: `Note **${title}** deleted successfully!`, ephemeral: true });
        }
    },
};