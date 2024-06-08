const { SlashCommandBuilder } = require('discord.js');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../settings.json');
const { Mesai } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesai-sifirla')
    .setDescription('Bütün mesai verilerini sıfırlar.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Belirtilen kullanıcının mesai verilerini sıfırlar.')
        .setRequired(false)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: 'Bu komutu kullanabilmek için "Yönetici" yetkisine sahip olmalısınız.',
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser('kullanici');
    const type = user ? 'user' : 'all';

    if (type === 'user') {
      const targetID = user.id;
      const mesaiDurumu = await Mesai.findOne({ userID: targetID });

      if (!mesaiDurumu) {
        return interaction.reply({
          content: 'Bu kullanıcının mesai verisi bulunmuyor.',
          ephemeral: true,
        });
      }

      await Mesai.deleteOne({ userID: targetID });

      const logChannel = interaction.client.channels.cache.get(config.settings.channels.log);
      const logEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${config.settings.departmentName} Mesai Sıfırlama Log`,
          iconURL: config.settings.departmentLogo,
        })
        .setColor('Red')
        .setDescription(`**Sıfırlayan Yönetici:** <@${interaction.user.id}>\n**Sıfırlanan Kullanıcı:** <@${targetID}>`);

      logChannel.send({ embeds: [logEmbed] });

      await interaction.reply({
        content: 'Kullanıcının mesai verisi başarıyla sıfırlandı.',
        ephemeral: true,
      });
    } else {
      await Mesai.deleteMany({});

      const logChannel = interaction.client.channels.cache.get(config.settings.channels.log);
      const logEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${config.settings.departmentName} Mesai Sıfırlama Log`,
          iconURL: config.settings.departmentLogo,
        })
        .setColor('Red')
        .setDescription(`**Sıfırlayan Yönetici:** <@${interaction.user.id}>\n**Sıfırlanan Kullanıcılar:** Tüm kullanıcılar`);

      logChannel.send({ embeds: [logEmbed] });

      await interaction.reply({
        content: 'Bütün mesai verileri başarıyla sıfırlandı.',
        ephemeral: true,
      });
    }
  }
};
