import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { MusicQueue } from '../../handlers/musicHandler.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('247')
    .setDescription('Toggle 24/7 mode - bot stays in voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        embeds: [errorEmbed('You must be in a voice channel!')],
        ephemeral: true,
      });
    }

    const current247 = interaction.client.twentyFourSeven.get(interaction.guildId);

    if (current247?.enabled) {
      // Disable 24/7
      interaction.client.twentyFourSeven.delete(interaction.guildId);

      // If no songs in queue, disconnect
      const queue = interaction.client.musicQueues.get(interaction.guildId);
      if (queue && !queue.playing && queue.songs.length === 0) {
        queue.destroy();
      }

      return interaction.reply({
        embeds: [successEmbed('24/7 mode has been **disabled**. The bot will leave when inactive.')],
      });
    }

    // Enable 24/7
    interaction.client.twentyFourSeven.set(interaction.guildId, {
      enabled: true,
      channelId: voiceChannel.id,
    });

    // Make sure bot is connected
    let queue = interaction.client.musicQueues.get(interaction.guildId);
    if (!queue) {
      queue = new MusicQueue(interaction.client, interaction.guildId);
      interaction.client.musicQueues.set(interaction.guildId, queue);
      await queue.connect(voiceChannel);
      queue.textChannel = interaction.channel;
    }

    await interaction.reply({
      embeds: [successEmbed(`24/7 mode has been **enabled**! I'll stay in ${voiceChannel} permanently.`)],
    });
  },
};