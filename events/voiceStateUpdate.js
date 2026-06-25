export default {
  name: 'voiceStateUpdate',
  once: false,
  async execute(oldState, newState) {
    const client = oldState.client || newState.client;
    const guildId = oldState.guild?.id || newState.guild?.id;

    if (!guildId) return;

    const queue = client.musicQueues.get(guildId);
    if (!queue) return;

    // Check if bot was disconnected
    if (oldState.member?.id === client.user.id && !newState.channelId) {
      const is247 = client.twentyFourSeven.get(guildId);

      if (is247?.enabled) {
        // Reconnect for 24/7 mode
        setTimeout(async () => {
          try {
            const guild = client.guilds.cache.get(guildId);
            const channel = guild?.channels.cache.get(is247.channelId);
            if (channel) {
              await queue.connect(channel);
              if (queue.currentSong || queue.songs.length > 0) {
                if (!queue.playing) {
                  await queue.play();
                }
              }
            }
          } catch (err) {
            console.error('24/7 reconnect failed:', err);
          }
        }, 2000);
      } else {
        queue.destroy();
      }
      return;
    }

    // Check if bot is alone in voice channel (not in 24/7 mode)
    if (oldState.channelId && !newState.channelId) {
      const botVoiceChannel = oldState.guild.channels.cache.get(queue.connection?.joinConfig?.channelId);
      if (botVoiceChannel) {
        const members = botVoiceChannel.members.filter((m) => !m.user.bot);
        if (members.size === 0) {
          const is247 = client.twentyFourSeven.get(guildId);
          if (!is247?.enabled) {
            setTimeout(() => {
              const currentMembers = botVoiceChannel.members.filter((m) => !m.user.bot);
              if (currentMembers.size === 0) {
                queue.destroy();
                if (queue.textChannel) {
                  queue.textChannel.send('👋 Left the voice channel because I was alone.').catch(console.error);
                }
              }
            }, 30000); // 30 second timeout
          }
        }
      }
    }
  },
};