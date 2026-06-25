import { SlashCommandBuilder } from 'discord.js';
import { closeTicket } from '../../handlers/ticketHandler.js';
import { errorEmbed } from '../../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Close the current ticket'),

  async execute(interaction) {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({
        embeds: [errorEmbed('This command can only be used in ticket channels.')],
        ephemeral: true,
      });
    }

    await closeTicket(interaction);
  },
};