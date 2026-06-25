import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import config from './config.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

// Collections
client.commands = new Collection();
client.musicQueues = new Collection();
client.twentyFourSeven = new Collection(); // guild -> { channelId, enabled }
client.activeTickets = new Collection();

// Load commands and events
await loadCommands(client);
await loadEvents(client);

// Login
client.login(config.token);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});