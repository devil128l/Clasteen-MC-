import { ActivityType } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`🤖 Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);

    client.user.setPresence({
      activities: [
        {
          name: '🎵 Music & 🎫 Tickets',
          type: ActivityType.Playing,
        },
      ],
      status: 'online',
    });
  },
};