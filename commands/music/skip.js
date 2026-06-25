import { SlashCommandBuilder } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);

    if (!queue || !queue.playing) {
      return interaction.reply({
        embeds: [errorEmbed('There is no music playing!')],
        ephemeral: true,
      });
    }

    const skipped = queue.currentSong?.title || 'Unknown';
    queue.skip();

    await interaction.reply({
      embeds: [successEmbed(`Skipped **${skipped}**`)],
    });
  },
};