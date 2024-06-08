const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Mazeret } = require('../utils/database');
const axios = require('axios');
const config = require('../settings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mazeret')
    .setDescription('Mazeret ekler veya mazeretleri sorgular.')
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Mazeret sebebini girin.')
        .setRequired(false)
    )
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Mazeretlerini görüntülemek istediğiniz kullanıcıyı seçin.')
        .setRequired(false)
    ),
  async execute(interaction) {
    const sebep = interaction.options.getString('sebep');
    const kullanici = interaction.options.getUser('kullanici');

    if (sebep) {
      await Mazeret.create({
        userID: interaction.user.id,
        reason: sebep
      });

      await interaction.reply({
        content: 'Mazeretiniz başarıyla kaydedildi.',
        ephemeral: true,
      });
    } else if (kullanici) {
      const mazeretler = await Mazeret.find({ userID: kullanici.id });

      if (!mazeretler.length) {
        return interaction.reply({
          content: `${kullanici} kullanıcısının mazeret verisi bulunmamaktadır.`,
          ephemeral: true,
        });
      }

      let description = '';
      mazeretler.forEach((mazeret, index) => {
        description += `${index + 1}. ${mazeret.reason} (Tarih: <t:${Math.floor(mazeret.timestamp.getTime() / 1000)}:R>)\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle(`${kullanici.tag} - Mazeretler`)
        .setDescription(description)
        .setColor(config.settings.departmentColor)
        .setTimestamp();

      const button = new ButtonBuilder()
        .setLabel('Mazeretleri Web Sayfasında Görüntüle')
        .setStyle(ButtonStyle.Link)
        .setURL(`http://${config.web.hostname}:${config.web.port}/mazeret/${kullanici.id}`);

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } else {
      return interaction.reply({
        content: 'Lütfen bir mazeret sebebi girin veya mazeretlerini görüntülemek istediğiniz kullanıcıyı seçin.',
        ephemeral: true,
      });
    }
  }
};
