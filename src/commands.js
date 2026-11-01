import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check the configured Minecraft Java server status.'),

  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement to the configured channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option
      .setName('message')
      .setDescription('Announcement text (up to 1800 characters).')
      .setRequired(true)
      .setMaxLength(1800))
    .addChannelOption((option) => option
      .setName('channel')
      .setDescription('Optional destination channel.')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)),

  new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Post a maintenance start or completion notice.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option
      .setName('action')
      .setDescription('Choose whether maintenance is starting or finished.')
      .setRequired(true)
      .addChoices(
        { name: 'Start maintenance', value: 'start' },
        { name: 'Maintenance completed', value: 'end' },
      ))
    .addStringOption((option) => option
      .setName('details')
      .setDescription('Optional details for your community.')
      .setRequired(false)
      .setMaxLength(1000)),
].map((command) => command.toJSON());
