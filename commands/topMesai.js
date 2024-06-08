const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { Mesai } = require('../utils/database');
const config = require('../settings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topmesai')
    .setDescription('Tüm zamanlarda en çok mesai yapanları listeler.'),
  async execute(interaction) {
    const mesailer = await Mesai.find().sort({ toplamMesai: -1 }).limit(10);

    if (!mesailer.length) {
      return interaction.reply({
        content: 'Henüz mesai verisi bulunmamaktadır.',
        ephemeral: true,
      });
    }

    const mesaiListesi = [];
    for (const mesai of mesailer) {
      const user = await interaction.guild.members.fetch(mesai.userID);
      mesaiListesi.push({
        user: user,
        toplamMesai: timeDifference2(mesai.toplamMesai)
      });
    }

    let description = mesaiListesi.map((mesai, index) => `**${index + 1}.** ${mesai.user} ・ ${mesai.toplamMesai}`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🏆 Tüm Zamanların En Çok Mesai Yapanları')
      .setDescription(description)
      .setColor('#FFD700')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Mesai Sistemi', iconURL: config.settings.departmentLogo })
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
