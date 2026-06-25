import { EmbedBuilder } from 'discord.js';
import config from '../config.js';

export function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || config.embedColor)
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.footer) embed.setFooter({ text: options.footer });
  if (options.fields) embed.addFields(...options.fields);

  return embed;
}

export function successEmbed(description) {
  return createEmbed({ description: `✅ ${description}`, color: config.successColor });
}

export function errorEmbed(description) {
  return createEmbed({ description: `❌ ${description}`, color: config.errorColor });
}

export function warningEmbed(description) {
  return createEmbed({ description: `⚠️ ${description}`, color: config.warningColor });
}