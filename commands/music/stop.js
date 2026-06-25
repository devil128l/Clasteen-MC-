import { SlashCommandBuilder } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);

    if (!queue) {
      return interaction.reply({
        embeds: [errorEmbed('There is no music playing!')],
        ephemeral: true,
      });
    }

    const is247 = interaction.client.twentyFourSeven.get(interaction.guildId);

    queue.stop();

    if (!is247?.enabled) {
      queue.destroy();
    }

    await interaction.reply({
      embeds: [successEmbed('Stopped the music and cleared the queue.')],
    });
  },
};