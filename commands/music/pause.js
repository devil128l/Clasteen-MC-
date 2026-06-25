import { SlashCommandBuilder } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);

    if (!queue || !queue.playing) {
      return interaction.reply({
        embeds: [errorEmbed('There is no music playing!')],
        ephemeral: true,
      });
    }

    if (queue.paused) {
      return interaction.reply({
        embeds: [errorEmbed('The music is already paused!')],
        ephemeral: true,
      });
    }

    queue.pause();

    await interaction.reply({
      embeds: [successEmbed('Paused the music. Use `/resume` to continue.')],
    });
  },
};