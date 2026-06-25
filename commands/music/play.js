import { SlashCommandBuilder } from 'discord.js';
import { MusicQueue, searchSong } from '../../handlers/musicHandler.js';
import { errorEmbed, successEmbed, createEmbed } from '../../utils/embed.js';
import config from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or add it to the queue')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Song name or YouTube URL')
        .setRequired(true)
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        embeds: [errorEmbed('You must be in a voice channel to play music!')],
        ephemeral: true,
      });
    }

    const botPermissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!botPermissions.has('Connect') || !botPermissions.has('Speak')) {
      return interaction.reply({
        embeds: [errorEmbed('I need permissions to join and speak in your voice channel!')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const query = interaction.options.getString('query');
    const songs = await searchSong(query);

    if (!songs || songs.length === 0) {
      return interaction.editReply({
        embeds: [errorEmbed('No results found for your query.')],
      });
    }

    let queue = interaction.client.musicQueues.get(interaction.guildId);

    if (!queue) {
      queue = new MusicQueue(interaction.client, interaction.guildId);
      interaction.client.musicQueues.set(interaction.guildId, queue);
      await queue.connect(voiceChannel);
    }

    queue.textChannel = interaction.channel;

    // Add songs to queue
    for (const song of songs) {
      song.requestedBy = interaction.user;
      await queue.addSong(song);
    }

    if (songs.length === 1) {
      const embed = createEmbed({
        title: queue.playing ? '📋 Added to Queue' : '🎵 Now Playing',
        description: `**[${songs[0].title}](${songs[0].url})**`,
        fields: [
          { name: 'Duration', value: songs[0].duration || 'Unknown', inline: true },
          { name: 'Position', value: queue.playing ? `#${queue.songs.length}` : 'Now', inline: true },
        ],
        thumbnail: songs[0].thumbnail,
      });
      await interaction.editReply({ embeds: [embed] });
    } else {
      const embed = createEmbed({
        title: '📋 Playlist Added',
        description: `Added **${songs.length}** songs to the queue.`,
        color: config.successColor,
      });
      await interaction.editReply({ embeds: [embed] });
    }

    // Start playing if not already
    if (!queue.playing) {
      await queue.play();
    }
  },
};