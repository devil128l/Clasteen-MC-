import {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import config from '../config.js';

export async function createTicket(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;

  // Check if user already has an open ticket
  const existingTicket = guild.channels.cache.find(
    (ch) => ch.name === `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}` && ch.type === ChannelType.GuildText
  );

  if (existingTicket) {
    return interaction.reply({
      content: `❌ You already have an open ticket: ${existingTicket}`,
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const sanitizedName = member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');

  const ticketChannel = await guild.channels.create({
    name: `ticket-${sanitizedName}`,
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId || null,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
        ],
      },
    ],
  });

  const embed = new EmbedBuilder()
    .setTitle('🎫 Support Ticket')
    .setDescription(
      `Welcome ${member}!\n\nPlease describe your issue and a staff member will assist you shortly.\n\nClick the button below to close this ticket.`
    )
    .setColor(config.embedColor)
    .setTimestamp()
    .setFooter({ text: `Ticket by ${member.user.tag}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel('Claim Ticket')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✋'),
  );

  await ticketChannel.send({ embeds: [embed], components: [row] });

  await interaction.editReply({
    content: `✅ Your ticket has been created: ${ticketChannel}`,
  });

  // Log ticket creation
  if (config.ticketLogChannelId) {
    const logChannel = guild.channels.cache.get(config.ticketLogChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🎫 Ticket Created')
        .addFields(
          { name: 'User', value: `${member} (${member.user.tag})`, inline: true },
          { name: 'Channel', value: `${ticketChannel}`, inline: true },
        )
        .setColor(config.successColor)
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  }
}

export async function closeTicket(interaction) {
  const channel = interaction.channel;

  if (!channel.name.startsWith('ticket-')) {
    return interaction.reply({
      content: '❌ This is not a ticket channel.',
      ephemeral: true,
    });
  }

  await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });

  // Generate transcript
  const messages = await channel.messages.fetch({ limit: 100 });
  const transcript = messages
    .reverse()
    .map((m) => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content || '[Embed/Attachment]'}`)
    .join('\n');

  // Log ticket closure
  if (config.ticketLogChannelId) {
    const logChannel = interaction.guild.channels.cache.get(config.ticketLogChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🎫 Ticket Closed')
        .addFields(
          { name: 'Channel', value: channel.name, inline: true },
          { name: 'Closed By', value: `${interaction.user}`, inline: true },
          { name: 'Messages', value: `${messages.size}`, inline: true },
        )
        .setColor(config.errorColor)
        .setTimestamp();

      // Send transcript as file
      const buffer = Buffer.from(transcript, 'utf-8');
      await logChannel.send({
        embeds: [logEmbed],
        files: [{ attachment: buffer, name: `transcript-${channel.name}.txt` }],
      });
    }
  }

  setTimeout(async () => {
    await channel.delete().catch(console.error);
  }, 5000);
}

export async function claimTicket(interaction) {
  const channel = interaction.channel;

  if (!channel.name.startsWith('ticket-')) {
    return interaction.reply({
      content: '❌ This is not a ticket channel.',
      ephemeral: true,
    });
  }

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({
      content: '❌ You need `Manage Channels` permission to claim tickets.',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setDescription(`✋ This ticket has been claimed by ${interaction.user}`)
    .setColor(config.successColor)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}