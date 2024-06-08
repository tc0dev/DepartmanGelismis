const { SlashCommandBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../settings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesai')
    .setDescription('Mesai kontrol paneli.'),
  async execute(interaction) {
    const mesaiEmbed = new EmbedBuilder()
      .setAuthor({
        name: `${config.settings.departmentName} Mesai Kontrol`,
        iconURL: config.settings.departmentLogo,
      })
      .setColor(config.settings.departmentColor)
      .setDescription(`🎉 Merhaba! Mesai yönetim paneline hoş geldiniz! Buradan mesaiye \`Giriş/Çıkış\` yapabilirsiniz.\n\n🚀・**Mesaiye Başla:** Mesaiye **başlamanıza** yardımcı olur.\n🛑・**Mesaiyi Bitir:** Mesai sürecinizi **sonlandırır**.\n\n⚠️・Lütfen oyunda olmadığınız zamanlarda mesainizi kapatmayı unutmayın. Aksi halde verileriniz silinebilir ve tekrarında ihraç edilebilirsiniz.`)
      .setImage(config.settings.departmentBanner);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('mesai_gir')
        .setLabel('Mesaiye Başla')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🚀'),
      new ButtonBuilder()
        .setCustomId('mesai_cik')
        .setLabel('Mesaiyi Bitir')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛑'),
      new ButtonBuilder()
        .setCustomId('bilgilerim')
        .setLabel('Mesai Bilgilerim')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊')
    );

    await interaction.reply({ embeds: [mesaiEmbed], components: [row] });
  }
};
