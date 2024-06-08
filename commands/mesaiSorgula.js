const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { Mesai } = require('../utils/database');
const config = require('../settings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesai-sorgula')
    .setDescription('Belirtilen kullanıcının veya rolün toplam mesai süresini gösterir.')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Mesaisini görmek istediğiniz kullanıcıyı seçin.')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Mesaisini görmek istediğiniz rolü seçin.')
        .setRequired(false)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const role = interaction.options.getRole('rol');

    if (!user && !role) {
      return interaction.reply({
        content: 'Lütfen bir kullanıcı veya rol belirtin.',
        ephemeral: true,
      });
    }

    let description = '';
    if (user) {
      const mesai = await Mesai.findOne({ userID: user.id });
      if (!mesai) {
        return interaction.reply({
          content: `${user} kullanıcısının mesai verisi bulunmamaktadır.`,
          ephemeral: true,
        });
      }

      description = `${user} - ${timeDifference2(mesai.toplamMesai)}`;
    } else if (role) {
      const members = role.members.map(member => member.user.id);
      const mesailer = await Mesai.find({ userID: { $in: members } });

      if (!mesailer.length) {
        return interaction.reply({
          content: `${role} rolündeki kullanıcıların mesai verisi bulunmamaktadır.`,
          ephemeral: true,
        });
      }

      let totalMesai = 0;
      for (const mesai of mesailer) {
        totalMesai += mesai.toplamMesai;
      }

      description = `${role} rolündeki kullanıcıların toplam mesai süresi: ${timeDifference2(totalMesai)}`;
    }

    const embed = new EmbedBuilder()
      .setTitle('Mesai Sorgulama Sonuçları')
      .setDescription(description)
      .setColor(config.settings.departmentColor)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

function timeDifference2(ms) {
  var days = Math.floor(ms / (24 * 60 * 60 * 1000));
  var daysms = ms % (24 * 60 * 60 * 1000);
  var hours = Math.floor(daysms / (60 * 60 * 1000));
  var hoursms = ms % (60 * 60 * 1000);
  var minutes = Math.floor(hoursms / (60 * 1000));
  var minutesms = ms % (60 * 1000);
  var sec = Math.floor(minutesms / 1000);
  var t = `${days} Gün ${hours} Saat ${minutes} Dakika ${sec} Saniye`;
  return t;
}
