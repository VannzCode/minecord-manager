import 'dotenv/config';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalInteger(name, fallback, min, max) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

export const config = {
  discordToken: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  guildId: process.env.GUILD_ID?.trim() || null,
  minecraftHost: process.env.MINECRAFT_HOST?.trim() || '',
  minecraftPort: optionalInteger('MINECRAFT_PORT', 25565, 1, 65535),
  minecraftTimeoutMs: optionalInteger('MINECRAFT_TIMEOUT_MS', 5000, 1000, 30000),
  announcementChannelId: process.env.ANNOUNCEMENT_CHANNEL_ID?.trim() || null,
  adminRoleIds: (process.env.ADMIN_ROLE_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
  activityText: process.env.BOT_ACTIVITY_TEXT?.trim() || 'Watching your Minecraft server',
};
