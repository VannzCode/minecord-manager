# Minecord Manager

An open-source Discord bot starter for Minecraft Java Edition communities. It provides server status checks, community announcements, and maintenance notices in one small self-hosted project.

> **Project status:** early development (v0.1.0). This is a starter release. Test it on a private Discord server before using it in a production community.

## Features

- `/status` — query a Minecraft Java Edition server using the built-in status protocol.
- `/announce` — publish a formatted announcement to a chosen or configured text channel.
- `/maintenance` — publish maintenance-start and maintenance-completed notices.
- Permission checks for administrative commands.
- Configurable with environment variables; no credentials are committed to the repository.
- Built-in Node.js tests for the Minecraft status protocol helpers.

## Requirements

- Node.js 24.17.0 or newer.
- A Discord application and bot token.
- A Minecraft Java Edition server address for `/status`.

## Quick start

1. Clone this repository and enter its directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your Discord application values.
4. Invite the bot to your Discord server with the `bot` and `applications.commands` scopes. Grant it View Channels, Send Messages, and Embed Links in the channels where it will post.
5. Register slash commands:

   ```bash
   npm run commands:deploy
   ```

6. Start the bot:

   ```bash
   npm start
   ```

For development, set `GUILD_ID` to your test server ID. Guild commands update faster during iteration. Leave it empty when you are ready to register global commands.

## Configuration

| Variable | Required | Default | Description |
|---|---:|---:|---|
| `DISCORD_TOKEN` | Yes | — | Bot token. Keep it private. |
| `CLIENT_ID` | Yes | — | Discord application ID. |
| `GUILD_ID` | No | — | Test server ID for guild command registration. |
| `MINECRAFT_HOST` | For `/status` | — | Minecraft Java server hostname or IP. |
| `MINECRAFT_PORT` | No | `25565` | Minecraft Java server port. |
| `MINECRAFT_TIMEOUT_MS` | No | `5000` | Status query timeout (1000–30000 ms). |
| `ANNOUNCEMENT_CHANNEL_ID` | No | — | Default destination for announcement and maintenance posts. |
| `ADMIN_ROLE_IDS` | No | — | Comma-separated extra role allow-list. Manage Server permission is still required. |
| `BOT_ACTIVITY_TEXT` | No | `Watching your Minecraft server` | Bot activity text. |

If `ANNOUNCEMENT_CHANNEL_ID` is empty, announcements are posted in the channel where the command was used. `/announce` can override the destination with its optional `channel` option.

## Commands

| Command | Access | Purpose |
|---|---|---|
| `/status` | Everyone | Check Java server status, version, and player count. |
| `/announce message:<text> channel:<optional>` | Manage Server | Send a community announcement. |
| `/maintenance action:<start\|end> details:<optional>` | Manage Server | Post a maintenance update. |

The bot suppresses automatic `@everyone` and `@here` mentions in user-provided announcement text. This helps prevent accidental mass mentions.

## Development

```bash
npm test
npm run check
```

The Minecraft Java status client uses Node.js built-in networking modules; it does not need a separate Minecraft query package.

## Limitations in v0.1.0

- `/status` currently supports Minecraft Java Edition only, not Bedrock Edition.
- Maintenance notices are announcements only; they do not stop or restart a Minecraft server.
- Scheduled posts, persistent maintenance state, player join/leave events, and web dashboards are not included yet.
- The bot needs network access from its host to the Minecraft server's Java status port.

## Security

- Never commit `.env`, bot tokens, API keys, or private server credentials.
- If a token is exposed, reset it in the Discord Developer Portal immediately.
- Give the bot only the permissions it needs.
- See [SECURITY.md](SECURITY.md) for reporting security issues.

## Contributing

Issues and pull requests are welcome. Please include reproduction steps for bugs and tests for protocol or command changes. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
