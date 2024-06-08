const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const config = require('../settings.json');
const { Mesai } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aktif-mesai')
    .setDescription('Aktif ve pasif mesai listesi.'),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.commands.activeDuty.requiredRole)) {
      return interaction.reply({
        content: 'Bu komutu kullanabilmek için gerekli rolünüz yok.',
        ephemeral: true,
      });
    }

    const aktifMesaiEmbed = new EmbedBuilder()
      .setAuthor({
        name: `${config.settings.departmentName} Mesai Listesi`,
        iconURL: config.settings.departmentLogo,
      })
      .setColor(config.settings.departmentColor)
      .setFooter({ text: 'Mesai bilgilerini güncel tutun!' });

    let activeDescription = '';
    let inactiveDescription = '';
    const guild = interaction.client.guilds.cache.get(config.guild.id);
    const membersData = [];

    for (const member of guild.members.cache.values()) {
      if (member.roles.cache.some(role => config.settings.roles.officers.includes(role.id))) {
        const mesaiDurumu = await Mesai.findOne({ userID: member.user.id });
        const roles = member.roles.cache
          .filter(role => config.settings.roles.officers.includes(role.id))
          .map(role => `<@&${role.id}>`)
          .join(', ');

        if (mesaiDurumu && mesaiDurumu.mesaiDurumu) {
          membersData.push({
            id: member.user.id,
            name: member.user.username,
            roles: roles,
            mesaiGiris: mesaiDurumu.mesaiGiris,
            active: true
          });
        } else {
          membersData.push({
            id: member.user.id,
            name: member.user.username,
            roles: roles,
            mesaiGiris: mesaiDurumu ? mesaiDurumu.mesaiGiris : null,
            active: false
          });
        }
      }
    }

    membersData.sort((a, b) => (a.active === b.active ? a.mesaiGiris - b.mesaiGiris : b.active - a.active));

    for (const member of membersData) {
      if (member.active) {
        activeDescription += `${config.settings.emojis.on} <@${member.id}> - ${member.roles} - <t:${member.mesaiGiris}:R>\n`;
      } else {
        inactiveDescription += `${config.settings.emojis.off} <@${member.id}> - ${member.roles}\n`;
      }
    }

    if (!activeDescription) {
      activeDescription = 'Şu anda aktif mesai yapan kimse yok.';
    }
    if (!inactiveDescription) {
      inactiveDescription = 'Şu anda pasif durumda olan kimse yok.';
    }

    aktifMesaiEmbed.addFields(
      { name: 'Aktif Mesai Yapanlar', value: activeDescription, inline: false },
      { name: 'Pasif Durumda Olanlar', value: inactiveDescription, inline: false }
    );

    const response = await axios.post(`http://${config.web.hostname}:${config.web.port}/embed`, aktifMesaiEmbed.toJSON());
    const { embedCode } = response.data;

    const button = new ButtonBuilder()
      .setLabel('Web sayfasını kontrol edin')
      .setStyle(ButtonStyle.Link)
      .setURL(`http://${config.web.hostname}:${config.web.port}/embed/${embedCode}`);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      content: 'Mesai listesi başarıyla güncellendi.',
      embeds: [aktifMesaiEmbed],
      components: [row],
      ephemeral: true
    });
  }
};
