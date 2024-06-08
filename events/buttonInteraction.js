const { EmbedBuilder } = require('discord.js');
const { Mesai } = require('../utils/database');
const config = require('../settings.json');
const { setBotPresence } = require('../utils/presenceManager');
const { getMemberBadge, timeDifference2, timeDifference } = require('../utils/helpers');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    try {
      if (interaction.customId === 'mesai_gir') {
        const mesaiDurumu = await Mesai.findOne({ userID: interaction.user.id });

        if (mesaiDurumu && mesaiDurumu.mesaiDurumu) {
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({
              content: '🔔 Zaten mesaiye giriş yapmışsınız.',
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: '🔔 Zaten mesaiye giriş yapmışsınız.',
              ephemeral: true,
            });
          }
          return;
        }

        let toplamMesai = 'Daha önce mesaiye giriş yapmamışsınız.';
        if (mesaiDurumu && mesaiDurumu.toplamMesai > 0) {
          toplamMesai = timeDifference2(mesaiDurumu.toplamMesai);
        }

        const girEmbed = new EmbedBuilder()
          .setAuthor({
            name: `${config.settings.departmentName} Mesai Sistemi`,
            iconURL: config.settings.departmentLogo,
          })
          .setColor('Green')
          .setDescription(
            `🎉 Merhaba! Mesaiye hoş geldiniz, burada her anınız kıymetli! 💪\n\n🕒 **Mesai Başlama Zamanı:** <t:${Math.floor(
              Date.now() / 1000
            )}:R>\n⏱️ **Toplam Mesai Süresi:** ${toplamMesai}\n\n⚠️ Unutmayın, emek olmadan yemek olmaz.`
          )
          .setImage(config.settings.departmentBanner);

        await interaction.reply({ embeds: [girEmbed], ephemeral: true });

        if (!mesaiDurumu) {
          await Mesai.create({
            userID: interaction.user.id,
            mesaiDurumu: true,
            mesaiGiris: Math.floor(Date.now() / 1000),
            ilkMesaiDurumu: true,
            ilkMesaiTimestamp: Math.floor(Date.now() / 1000),
            ilkMesaiTarihi: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
          });
        } else {
          mesaiDurumu.mesaiDurumu = true;
          mesaiDurumu.mesaiGiris = Math.floor(Date.now() / 1000);
          await mesaiDurumu.save();
        }

        const logChannel = interaction.client.channels.cache.get(config.settings.channels.log);
        const logEmbed = new EmbedBuilder()
          .setAuthor({
            name: `${config.settings.departmentName} Mesai Giriş Log`,
            iconURL: config.settings.departmentLogo,
          })
          .setColor('Green')
          .setDescription(
            `👤 **Giriş Yapan Memur:** <@${interaction.user.id}>\n🏅 **Memurun Rozeti:** ${getMemberBadge(
              interaction.member
            )}\n📅 **Mesai Başlama Tarihi:** <t:${Math.floor(
              Date.now() / 1000
            )}:D>\n⏱️ **Toplam Mesai:** ${toplamMesai}`
          )
          .setImage(config.settings.departmentBanner);

        logChannel.send({ embeds: [logEmbed] });

        await setBotPresence(interaction.client);

      } else if (interaction.customId === 'mesai_cik') {
        const mesaiDurumu = await Mesai.findOne({ userID: interaction.user.id });

        if (!mesaiDurumu || !mesaiDurumu.mesaiDurumu) {
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({
              content: '🔔 Zaten mesaiden çıkış yapmışsınız.',
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: '🔔 Zaten mesaiden çıkış yapmışsınız.',
              ephemeral: true,
            });
          }
          return;
        }

        const totalOnDutyTime = new Date() - new Date(mesaiDurumu.mesaiGiris * 1000) + mesaiDurumu.toplamMesai;

        mesaiDurumu.toplamMesai = totalOnDutyTime;
        mesaiDurumu.mesaiDurumu = false;
        mesaiDurumu.mesaiGiris = 0;
        await mesaiDurumu.save();

        let toplamMesaiText = 'Daha önce mesaiye giriş yapmamışsınız.';
        if (mesaiDurumu.toplamMesai > 0) {
          toplamMesaiText = timeDifference2(totalOnDutyTime);
        }

        const cikEmbed = new EmbedBuilder()
          .setAuthor({
            name: `${config.settings.departmentName} Mesai Sistemi`,
            iconURL: config.settings.departmentLogo,
          })
          .setColor('Red')
          .setDescription(
            `🔔 Mesainizi başarıyla tamamladınız, emeğiniz için teşekkürler! 👏\n\n🕒 **Toplam Mesai Süresi:** ${toplamMesaiText}\n📅 **Mesai Bitiş Tarihi:** <t:${Math.floor(
              Date.now() / 1000
            )}:D>\n\n⚠️ Unutmayın, emek olmadan yemek olmaz.`
          )
          .setImage(config.settings.departmentBanner);

        await interaction.reply({ embeds: [cikEmbed], ephemeral: true });

        const logChannel = interaction.client.channels.cache.get(config.settings.channels.log);
        const logEmbed = new EmbedBuilder()
          .setAuthor({
            name: `${config.settings.departmentName} Mesai Çıkış Log`,
            iconURL: config.settings.departmentLogo,
          })
          .setColor('Red')
          .setDescription(
            `👤 **Çıkış Yapan Memur:** <@${interaction.user.id}>\n🏅 **Memurun Rozeti:** ${getMemberBadge(
              interaction.member
            )}\n📅 **Mesai Bitiş Tarihi:** <t:${Math.floor(
              Date.now() / 1000
            )}:D>\n⏱️ **Toplam Mesai:** ${toplamMesaiText}`
          )
          .setImage(config.settings.departmentBanner);

        logChannel.send({ embeds: [logEmbed] });

        await setBotPresence(interaction.client);
      } else if (interaction.customId === 'bilgilerim') {
        const mesaiDurumu = await Mesai.findOne({ userID: interaction.user.id });

        let totalOnDutyTime = 'Daha önce mesaiye giriş yapmamışsınız.';
        if (mesaiDurumu && mesaiDurumu.toplamMesai > 0) {
          totalOnDutyTime = timeDifference2(mesaiDurumu.toplamMesai);
        }
        let firstOnDutyTime = 'Daha önce mesaiye giriş yapmamışsınız.';
        if (mesaiDurumu && mesaiDurumu.ilkMesaiTarihi) {
          firstOnDutyTime = mesaiDurumu.ilkMesaiTarihi;
        }
        let firstOnDutyTimestamp = 'Daha önce mesaiye giriş yapmamışsınız.';
        if (mesaiDurumu && mesaiDurumu.ilkMesaiTimestamp) {
          firstOnDutyTimestamp = `<t:${mesaiDurumu.ilkMesaiTimestamp}:R>`;
        }

        const bilgilerimEmbed = new EmbedBuilder()
          .setAuthor({
            name: `${config.settings.departmentName} Mesai Sistemi`,
            iconURL: config.settings.departmentLogo,
          })
          .setColor(config.settings.departmentColor)
          .setDescription(
            `📊 Merhaba, <@${interaction.user.id}>!\n\n👋 **İlk mesaiye giriş yaptığınız tarih:**\n${firstOnDutyTime} ・ ${firstOnDutyTimestamp}\n\n⏰ **Toplam mesai süreniz:**\n${totalOnDutyTime}`
          )
          .setImage(config.settings.departmentBanner);

        await interaction.reply({ embeds: [bilgilerimEmbed], ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Bir hata oluştu, lütfen tekrar deneyin.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Bir hata oluştu, lütfen tekrar deneyin.', ephemeral: true });
      }
    }
  },
};
