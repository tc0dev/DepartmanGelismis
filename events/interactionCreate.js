const { EmbedBuilder } = require('discord.js');
const { Mesai } = require('../utils/database');
const config = require('../settings.json');
const { timeDifference, timeDifference2, getMemberBadge } = require('../utils/helpers');
const { setBotPresence } = require('../utils/presenceManager');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        });
      }
    }
  },
};
