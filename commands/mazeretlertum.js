const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Mazeret } = require('../utils/database');
const axios = require('axios');
const config = require('../settings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mazeretler')
    .setDescription('Tüm kullanıcıların mazeretlerini listeler.'),
  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: 'Bu komutu kullanabilmek için yetkiniz yok.',
        ephemeral: true,
      });
    }

    const mazeretler = await Mazeret.find();

    if (!mazeretler.length) {
      return interaction.reply({
        content: 'Henüz kaydedilmiş mazeret verisi bulunmamaktadır.',
        ephemeral: true,
      });
    }

    let description = '';
    for (const mazeret of mazeretler) {
      const user = await interaction.guild.members.fetch(mazeret.userID);
      description += `**${user.user.tag}**: ${mazeret.reason} (Tarih: <t:${Math.floor(mazeret.timestamp.getTime() / 1000)}:R>)\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle('Tüm Kullanıcıların Mazeretleri')
      .setDescription(description)
      .setColor(config.settings.departmentColor)
      .setTimestamp();

    const button = new ButtonBuilder()
      .setLabel('Mazeretleri Web Sayfasında Görüntüle')
      .setStyle(ButtonStyle.Link)
      .setURL(`http://${config.web.hostname}:${config.web.port}/mazeretler`);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
