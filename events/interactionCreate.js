import { createTicket, closeTicket, claimTicket } from '../handlers/ticketHandler.js';
import { errorEmbed } from '../utils/embed.js';

export default {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        const reply = {
          embeds: [errorEmbed('There was an error executing this command!')],
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(console.error);
        } else {
          await interaction.reply(reply).catch(console.error);
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      switch (interaction.customId) {
        case 'ticket_create':
          await createTicket(interaction);
          break;
        case 'ticket_close':
          await closeTicket(interaction);
          break;
        case 'ticket_claim':
          await claimTicket(interaction);
          break;
      }
    }
  },
};