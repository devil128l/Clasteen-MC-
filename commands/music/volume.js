import { SlashCommandBuilder } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the music volume')
    .addIntegerOption((option) =>
      option
        .setName('level')
        .setDescription('Volume level (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);

    if (!queue || !queue.playing) {
      return interaction.reply({
        embeds: [errorEmbed('There is no music playing!')],
        ephemeral: true,
      });
    }

    const volume = interaction.options.getInteger('level');
    queue.setVolume(volume);

    await interaction.reply({
      embeds: [successEmbed(`Volume set to **${volume}%** 🔊`)],
    });
  },
};