const readline = require('readline');
const { loadStore, saveStore } = require('./store');
const {
  connectBot,
  disconnectAllBots,
  disconnectBot,
  listBots,
  sendChat
} = require('./bots');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const menuOptions = [
  '1) List saved servers',
  '2) Add server',
  '3) Start bot',
  '4) List active bots',
  '5) Send chat message',
  '6) Disconnect bot',
  '7) Remove saved server',
  '0) Exit'
];

function ask(question) {
  return new Promise((resolve, reject) => {
    const onClose = () => reject(new Error('Terminal input closed.'));
    rl.once('close', onClose);
    rl.question(question, answer => {
      rl.removeListener('close', onClose);
      resolve(answer.trim());
    });
  });
}

function showMenu() {
  console.log('\n=== Minecraft Bot Manager ===');
  for (const option of menuOptions) console.log(option);
}

function showServers(servers) {
  if (!servers.length) {
    console.log('No saved servers yet.');
    return;
  }

  servers.forEach((server, index) => {
    console.log(`${index + 1}. [${server.edition.toUpperCase()}] ${server.name} — ${server.host}:${server.port}`);
  });
}

async function addServer(store) {
  const name = await ask('Server nickname: ');
  const edition = (await ask('Edition (java/bedrock): ')).toLowerCase();
  if (!['java', 'bedrock'].includes(edition)) {
    console.log('Edition must be java or bedrock.');
    return;
  }

  const host = await ask('Server address/IP: ');
  const defaultPort = edition === 'java' ? '25565' : '19132';
  const port = Number(await ask(`Port [${defaultPort}]: `) || defaultPort);
  if (!name || !host || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.log('Invalid name, host, or port.');
    return;
  }

  const username = await ask(edition === 'java'
    ? 'Microsoft account email (leave blank for offline-mode servers only): '
    : 'Gamertag / username: ');

  store.servers.push({
    id: Date.now().toString(36),
    name,
    edition,
    host,
    port,
    username
  });
  saveStore(store);
  console.log('Server saved.');
}

async function startBot(store) {
  showServers(store.servers);
  if (!store.servers.length) return;

  const index = Number(await ask('Choose server number: ')) - 1;
  const server = store.servers[index];
  if (!server) {
    console.log('Invalid selection.');
    return;
  }

  const username = await ask(`Bot username [${server.username || 'Bot'}]: `) || server.username || 'Bot';
  try {
    await connectBot(server, username);
  } catch (err) {
    console.log('Could not start bot:', err?.message || String(err));
  }
}

async function sendBotChat() {
  listBots();
  const id = await ask('Bot ID: ');
  const message = await ask('Message: ');
  sendChat(id, message);
}

async function removeServer(store) {
  showServers(store.servers);
  if (!store.servers.length) return;

  const index = Number(await ask('Server number to remove: ')) - 1;
  if (!store.servers[index]) {
    console.log('Invalid selection.');
    return;
  }

  const [removed] = store.servers.splice(index, 1);
  saveStore(store);
  console.log(`Removed ${removed.name}.`);
}

async function handleChoice(choice, store) {
  switch (choice) {
    case '1':
      showServers(store.servers);
      return true;
    case '2':
      await addServer(store);
      return true;
    case '3':
      await startBot(store);
      return true;
    case '4':
      listBots();
      return true;
    case '5':
      await sendBotChat();
      return true;
    case '6':
      listBots();
      disconnectBot(await ask('Bot ID: '));
      return true;
    case '7':
      await removeServer(store);
      return true;
    case '0':
      return false;
    default:
      console.log('Unknown option.');
      return true;
  }
}

async function runCli() {
  let store;
  try {
    store = loadStore();
    while (true) {
      showMenu();
      const shouldContinue = await handleChoice(await ask('Select: '), store);
      if (!shouldContinue) break;
      await ask('\nPress Enter to continue...');
    }
  } finally {
    try {
      disconnectAllBots();
      if (store) saveStore(store);
    } finally {
      rl.close();
    }
  }
}

module.exports = { runCli };
