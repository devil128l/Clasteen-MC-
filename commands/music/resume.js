import { SlashCommandBuilder } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);

    if (!queue) {
      return interaction.reply({
        embeds: [errorEmbed('There is no music in the queue!')],
        ephemeral: true,
      });
    }

    if (!queue.paused) {
      return interaction.reply({
        embeds: [errorEmbed('The music is not paused!')],
        ephemeral: true,
      });
    }

    queue.resume();

    await interaction.reply({
      embeds: [successEmbed('Resumed the music! 🎵')],
    });
  },
};