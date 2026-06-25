import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import config from "../../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an announcement message to a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Channel to send the announcement to")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("Announcement text")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("title")
        .setDescription("Optional embed title")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("color")
        .setDescription("Optional hex color like #5865F2")
        .setRequired(false)
    )
    .addBooleanOption((opt) =>
      opt
        .setName("embed")
        .setDescription("Send as embed (default: true)")
        .setRequired(false)
    )
    .addBooleanOption((opt) =>
      opt
        .setName("everyone")
        .setDescription("Ping @everyone (default: false)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const message = interaction.options.getString("message");
    const title = interaction.options.getString("title");
    const colorInput = interaction.options.getString("color");
    const useEmbed = interaction.options.getBoolean("embed") ?? true;
    const pingEveryone = interaction.options.getBoolean("everyone") ?? false;

    // Basic permission checks for the bot in target channel
    const me = interaction.guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has(["ViewChannel", "SendMessages"])) {
      return interaction.reply({
        content: "❌ I don't have permission to view/send messages in that channel.",
        ephemeral: true,
      });
    }

    // Parse color
    let color = config.embedColor;
    if (colorInput) {
      const cleaned = colorInput.replace("#", "").trim();
      if (/^[0-9a-fA-F]{6}$/.test(cleaned)) color = parseInt(cleaned, 16);
    }

    const content = pingEveryone ? "@everyone" : null;

    if (useEmbed) {
      const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(message)
        .setTimestamp();

      if (title) embed.setTitle(title);
      embed.setFooter({ text: `Announcement by ${interaction.user.tag}` });

      await channel.send({
        content,
        embeds: [embed],
        allowedMentions: { parse: pingEveryone ? ["everyone"] : [] },
      });
    } else {
      await channel.send({
        content: `${pingEveryone ? "@everyone\n" : ""}${message}`,
        allowedMentions: { parse: pingEveryone ? ["everyone"] : [] },
      });
    }

    return interaction.reply({
      content: `✅ Announcement sent in ${channel}.`,
      ephemeral: true,
    });
  },
};