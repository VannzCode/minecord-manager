import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commandDefinitions } from './commands.js';

const token = process.env.DISCORD_TOKEN?.trim();
const clientId = process.env.CLIENT_ID?.trim();
const guildId = process.env.GUILD_ID?.trim();

if (!token || !clientId) {
  throw new Error('Set DISCORD_TOKEN and CLIENT_ID before deploying commands.');
}

const rest = new REST({ version: '10' }).setToken(token);
const route = guildId
  ? Routes.applicationGuildCommands(clientId, guildId)
  : Routes.applicationCommands(clientId);

try {
  await rest.put(route, { body: commandDefinitions });
  console.log(`Successfully registered ${commandDefinitions.length} slash commands.`);
  console.log(guildId ? 'Commands are registered to the configured test guild.' : 'Commands are registered globally; propagation can take time.');
} catch (error) {
  console.error('Command registration failed:', error);
  process.exitCode = 1;
}
