import { REST, Routes } from 'discord.js';
import config from './config.js';
import { loadCommandsForDeploy } from './handlers/commandHandler.js';

const commands = await loadCommandsForDeploy();

const rest = new REST({ version: '10' }).setToken(config.token);

try {
  console.log(`Started refreshing ${commands.length} application (/) commands.`);

  // Deploy to specific guild (faster for testing)
  if (config.guildId) {
    const data = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );
    console.log(`Successfully reloaded ${data.length} guild commands.`);
  } else {
    // Deploy globally
    const data = await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands },
    );
    console.log(`Successfully reloaded ${data.length} global commands.`);
  }
} catch (error) {
  console.error(error);
}