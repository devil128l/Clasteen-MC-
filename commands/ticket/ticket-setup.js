import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import config from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Setup the ticket system in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Title for the ticket panel')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('Description for the ticket panel')
        .setRequired(false)
    ),

  async execute(interaction) {
    const title = interaction.options.getString('title') || '🎫 Support Tickets';
    const description =
      interaction.options.getString('description') ||
      'Click the button below to create a support ticket.\n\nA staff member will be with you shortly!';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(config.embedColor)
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_create')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫'),
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Ticket panel has been set up!', ephemeral: true });
  },
};