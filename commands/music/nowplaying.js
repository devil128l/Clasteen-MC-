import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing song'),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);

    if (!queue || !queue.currentSong) {
      return interaction.reply({
        embeds: [errorEmbed('Nothing is currently playing!')],
        ephemeral: true,
      });
    }

    const song = queue.currentSong;
    const is247 = interaction.client.twentyFourSeven.get(interaction.guildId);

    const embed = createEmbed({
      title: '🎵 Now Playing',
      description: `**[${song.title}](${song.url})**`,
      thumbnail: song.thumbnail,
      fields: [
        { name: 'Duration', value: song.duration || 'Unknown', inline: true },
        { name: 'Requested By', value: `${song.requestedBy}`, inline: true },
        { name: 'Volume', value: `${queue.volume}%`, inline: true },
        { name: 'Queue', value: `${queue.songs.length} songs`, inline: true },
        { name: 'Loop', value: queue.loop ? '✅' : '❌', inline: true },
        { name: '24/7', value: is247?.enabled ? '✅' : '❌', inline: true },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
};