# Minecraft Bot Manager

A terminal application for saving Minecraft server profiles and managing Java and Bedrock bot connections.

## Requirements

- Node.js 24 or newer
- A Minecraft server you own or are allowed to connect bots to

## Install and run on Windows

1. Open the project folder in PowerShell or VS Code.
2. Install dependencies and start the application:

```powershell
npm install
npm start
```

## Menu

- **List saved servers** shows profiles stored locally.
- **Add server** saves a Java or Bedrock profile.
- **Start bot** connects a bot to a selected profile.
- **List active bots**, **Send chat message**, and **Disconnect bot** manage active connections.
- **Remove saved server** deletes a saved profile.
- **Exit** disconnects active bots before closing.

## Project layout

```text
index.js       Application entry point
src/cli.js     Terminal menu and user interaction
src/bots.js    Java/Bedrock connections and active bot management
src/store.js   Local server profile persistence
data/          Generated local data, including servers.json
```

## Notes

- Server profiles are saved in `data/servers.json`.
- Java Microsoft authentication may prompt for device-code sign-in.
- Bedrock authentication and server compatibility depend on `bedrock-protocol` and the server setup.
- No automatic reconnect, anti-idle movement, server-specific bypasses, or guaranteed compatibility is included.
- Only use bots where the server permits them.

## Troubleshooting

- **`Cannot find module`**: run `npm install` from the project folder.
- **Bot is disconnected after joining**: check the server logs, version/protocol compatibility, authentication mode, and server rules.
- **Bedrock packet parse warning**: a packet may be skipped when the library cannot parse it. If the bot still joins and behaves as expected, the warning may not affect the features you use.

## Checks

Run the syntax check with:

```powershell
npm run check
```
