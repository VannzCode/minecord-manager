import {
  ActivityType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
} from 'discord.js';
import { config } from './config.js';
import { getJavaServerStatus } from './minecraft/java-status.js';

const ORANGE = 0xff7a18;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function isAllowed(interaction) {
  if (!interaction.inGuild() || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return false;
  }
  if (config.adminRoleIds.length === 0) return true;
  return config.adminRoleIds.some((roleId) => interaction.member.roles?.cache?.has(roleId));
}

function destinationFor(interaction, requestedChannel = null) {
  return requestedChannel
    ?? (config.announcementChannelId
      ? interaction.guild.channels.cache.get(config.announcementChannelId)
      : null)
    ?? interaction.channel;
}

function plainText(value) {
  return value.replace(/@everyone/g, '@\u200beveryone').replace(/@here/g, '@\u200bhere');
}

async function handleStatus(interaction) {
  if (!config.minecraftHost) {
    await interaction.reply({
      content: 'Minecraft status is not configured yet. Set `MINECRAFT_HOST` in your `.env` file.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();
  try {
    const status = await getJavaServerStatus({
      host: config.minecraftHost,
      port: config.minecraftPort,
      timeoutMs: config.minecraftTimeoutMs,
    });
    const embed = new EmbedBuilder()
      .setColor(ORANGE)
      .setTitle('Minecraft Server Status')
      .setDescription(status.description.slice(0, 4000))
      .addFields(
        { name: 'Status', value: '🟢 Online', inline: true },
        { name: 'Players', value: `${status.playersOnline}/${status.playersMax}`, inline: true },
        { name: 'Version', value: status.version.slice(0, 100), inline: true },
        { name: 'Address', value: `\`${config.minecraftHost}:${config.minecraftPort}\``, inline: false },
      )
      .setFooter({ text: 'Minecord Manager • Java Edition status' })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    const embed = new EmbedBuilder()
      .setColor(0xd9534f)
      .setTitle('Minecraft Server Status')
      .setDescription('🔴 The server could not be reached or did not respond in time.')
      .addFields({ name: 'Configured address', value: `\`${config.minecraftHost}:${config.minecraftPort}\`` })
      .setFooter({ text: 'Check the host, port, firewall, and server status.' })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
    console.warn(`Minecraft status check failed: ${error.message}`);
  }
}

async function handleAnnouncement(interaction) {
  if (!isAllowed(interaction)) {
    await interaction.reply({ content: 'You need the Manage Server permission to use this command.', ephemeral: true });
    return;
  }
  const message = plainText(interaction.options.getString('message', true));
  const requestedChannel = interaction.options.getChannel('channel');
  const channel = destinationFor(interaction, requestedChannel);
  if (!channel?.isTextBased() || !channel.send) {
    await interaction.reply({ content: 'I could not find a usable text channel. Check the bot permissions and channel ID.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(ORANGE)
    .setTitle('Community Announcement')
    .setDescription(message)
    .setFooter({ text: `Posted by ${interaction.user.username}` })
    .setTimestamp();

  await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  await interaction.reply({ content: `Announcement posted in ${channel}.`, ephemeral: true });
}

async function handleMaintenance(interaction) {
  if (!isAllowed(interaction)) {
    await interaction.reply({ content: 'You need the Manage Server permission to use this command.', ephemeral: true });
    return;
  }

  const action = interaction.options.getString('action', true);
  const details = interaction.options.getString('details');
  const starting = action === 'start';
  const channel = destinationFor(interaction);
  if (!channel?.isTextBased() || !channel.send) {
    await interaction.reply({ content: 'I could not find a usable text channel. Check the bot permissions and channel ID.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(starting ? 0xe0a526 : 0x2eae65)
    .setTitle(starting ? 'Scheduled Maintenance' : 'Maintenance Completed')
    .setDescription(starting
      ? 'The Minecraft server is entering maintenance. Please check back for updates.'
      : 'Maintenance is complete. The Minecraft server is ready for players again.')
    .setFooter({ text: `Update from ${interaction.user.username}` })
    .setTimestamp();
  if (details) embed.addFields({ name: 'Additional information', value: plainText(details) });

  await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  await interaction.reply({ content: `${starting ? 'Maintenance notice' : 'Completion notice'} posted in ${channel}.`, ephemeral: true });
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Minecord Manager is online as ${readyClient.user.tag}`);
  readyClient.user.setActivity(config.activityText, { type: ActivityType.Watching });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case 'status':
        await handleStatus(interaction);
        break;
      case 'announce':
        await handleAnnouncement(interaction);
        break;
      case 'maintenance':
        await handleMaintenance(interaction);
        break;
      default:
        await interaction.reply({ content: 'Unknown command.', ephemeral: true });
    }
  } catch (error) {
    console.error(`Command /${interaction.commandName} failed:`, error);
    const message = 'Something went wrong while running this command. Check the bot console for details.';
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

client.on(Events.Error, (error) => console.error('Discord client error:', error));

process.on('unhandledRejection', (error) => console.error('Unhandled promise rejection:', error));

client.login(config.discordToken).catch((error) => {
  console.error('Could not log in to Discord. Check DISCORD_TOKEN:', error.message);
  process.exitCode = 1;
});
