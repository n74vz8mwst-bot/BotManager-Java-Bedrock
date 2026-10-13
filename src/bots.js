const mineflayer = require('mineflayer');
const bedrock = require('bedrock-protocol');

const activeBots = new Map();
let nextId = 1;

function printBotEvent(record, event, detail = '') {
  const suffix = detail ? `: ${detail}` : '';
  console.log(`[${record.id}] ${record.username} ${event}${suffix}`);
}

function isBedrockNbtParseWarning(err) {
  return /^Read error for undefined : Invalid tag: \d+ > 20$/.test(err?.message || '');
}

async function connectBot(server, username) {
  if (!server || typeof server !== 'object') throw new Error('Server configuration is required.');
  if (!['java', 'bedrock'].includes(server.edition)) throw new Error('Server edition must be java or bedrock.');
  if (!server.host || !Number.isInteger(Number(server.port)) || Number(server.port) < 1 || Number(server.port) > 65535) {
    throw new Error('Server host and port are required.');
  }

  const id = String(nextId++);
  const displayName = username || server.username || 'Bot';

  if (server.edition === 'java') {
    const loginName = server.username || displayName;
    const options = {
      host: server.host,
      port: server.port,
      username: loginName,
      auth: server.username ? 'microsoft' : 'offline'
    };

    const client = mineflayer.createBot(options);
    const record = { id, username: displayName, edition: 'java', client, server };
    activeBots.set(id, record);
    client.once('login', () => printBotEvent(record, 'logged in'));
    client.on('spawn', () => printBotEvent(record, 'spawned in'));
    client.on('kicked', reason => printBotEvent(record, 'kicked', String(reason)));
    client.on('error', err => printBotEvent(record, 'error', err?.message || String(err)));
    client.on('end', reason => {
      printBotEvent(record, 'disconnected', String(reason || 'connection ended'));
      activeBots.delete(id);
    });
    console.log(`Starting Java bot ${id}. Microsoft authentication may open a device-code sign-in flow in this terminal.`);
    return record;
  }

  const client = bedrock.createClient({
    host: server.host,
    port: server.port,
    username: username || 'Bot',
    offline: false,
    skipPing: false
  });
  const record = { id, username: displayName, edition: 'bedrock', client, server };
  activeBots.set(id, record);
  client.on('join', () => printBotEvent(record, 'joined'));
  client.on('spawn', () => printBotEvent(record, 'spawned in'));
  client.on('text', packet => {
    const message = packet?.message || packet?.source_name || '';
    if (message) console.log(`[${id}] chat: ${message}`);
  });
  client.on('error', err => {
    if (!isBedrockNbtParseWarning(err)) {
      printBotEvent(record, 'error', err?.message || String(err));
    }
  });
  client.on('close', () => {
    printBotEvent(record, 'disconnected');
    activeBots.delete(id);
  });
  console.log(`Starting Bedrock bot ${id}. Check terminal output for authentication prompts.`);
  return record;
}

function listBots() {
  const bots = activeBots;
  if (!bots || bots.size === 0) return console.log('No active bots.');
  for (const [id, bot] of bots) {
    console.log(`${id}. [${bot.edition.toUpperCase()}] ${bot.username} @ ${bot.server.host}:${bot.server.port}`);
  }
}
function disconnectBot(id) {
  const bot = activeBots.get(String(id));
  if (!bot) return console.log('Bot not found.');
  try {
    if (bot.edition === 'java') bot.client.quit('Disconnected from manager');
    else bot.client.close();
  } catch (err) {
    console.log('Disconnect error:', err?.message || String(err));
  }
  activeBots.delete(String(id));
  console.log(`Disconnect requested for bot ${id}.`);
}

function disconnectAllBots() {
  for (const id of activeBots.keys()) disconnectBot(id);
}

function sendChat(id, message) {
  const bot = activeBots.get(String(id));
  if (!bot) {
    console.log('Bot not found.');
    return;
  }
  if (!message) {
    console.log('Message cannot be empty.');
    return;
  }

  try {
    if (bot.edition === 'java') {
      bot.client.chat(message);
    } else {
      bot.client.queue('text', {
        type: 'chat',
        needs_translation: false,
        source_name: bot.username,
        xuid: '',
        platform_chat_id: '',
        message
      });
    }
  } catch (err) {
    console.log('Could not send chat message:', err?.message || String(err));
  }
}

module.exports = {
  connectBot,
  disconnectAllBots,
  disconnectBot,
  listBots,
  sendChat
};
