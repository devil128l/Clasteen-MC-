import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embed.js';
import config from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue')
    .addIntegerOption((option) =>
      option.setName('page').setDescription('Page number').setRequired(false).setMinValue(1)
    ),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);

    if (!queue || (!queue.currentSong && queue.songs.length === 0)) {
      return interaction.reply({
        embeds: [errorEmbed('The queue is empty!')],
        ephemeral: true,
      });
    }

    const songsPerPage = 10;
    const page = (interaction.options.getInteger('page') || 1) - 1;
    const totalPages = Math.ceil(queue.songs.length / songsPerPage) || 1;

    const start = page * songsPerPage;
    const end = start + songsPerPage;
    const currentSongs = queue.songs.slice(start, end);

    let description = '';

    if (queue.currentSong) {
      description += `**Now Playing:**\n🎵 [${queue.currentSong.title}](${queue.currentSong.url}) | \`${queue.currentSong.duration || '?'}\` | ${queue.currentSong.requestedBy}\n\n`;
    }

    if (currentSongs.length > 0) {
      description += '**Queue:**\n';
      description += currentSongs
        .map((song, i) => `\`${start + i + 1}.\` [${song.title}](${song.url}) | \`${song.duration || '?'}\` | ${song.requestedBy}`)
        .join('\n');
    }

    const embed = createEmbed({
      title: `📋 Music Queue - ${interaction.guild.name}`,
      description,
      footer: `Page ${page + 1} of ${totalPages} | ${queue.songs.length} songs in queue`,
    });

    const is247 = interaction.client.twentyFourSeven.get(interaction.guildId);
    if (is247?.enabled) {
      embed.addFields({ name: '24/7 Mode', value: '✅ Enabled', inline: true });
    }
    if (queue.loop) {
      embed.addFields({ name: 'Loop', value: '🔁 Enabled', inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  },
};