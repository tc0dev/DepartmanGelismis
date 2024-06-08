const { SlashCommandBuilder } = require('discord.js');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../settings.json');
const { Mesai } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesai-ayarla')
    .setDescription('Bir kullanıcının mesai verilerini düzenleyin.')
    .addStringOption(option =>
      option.setName('islem')
        .setDescription('Yapmak istediğiniz işlemi seçin.')
        .setRequired(true)
        .addChoices(
          { name: 'Süre Ekle', value: 'ekle' },
          { name: 'Süre Çıkar', value: 'cikar' },
          { name: 'Süre Düzelt', value: 'duzelt' }
        )
    )
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Mesai verisi ayarlanacak kullanıcı.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sure')
        .setDescription('İşlem yapılacak mesai süresi. Örnek: 1 Gün, 2 Saat, 3 Dakika, 4 Saniye')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: 'Bu komutu kullanabilmek için `Yönetici` yetkisine sahip olmalısınız.',
        ephemeral: true,
      });
    }

    const islem = interaction.options.getString('islem');
    const target = interaction.options.getUser('kullanici');
    const sure = interaction.options.getString('sure');

    const mesaiDurumu = await Mesai.findOne({ userID: target.id });

    if (!mesaiDurumu) {
      return interaction.reply({
        content: 'Bu kullanıcının mesai verisi bulunmuyor.',
        ephemeral: true,
      });
    }

    if (!sure.includes('Gün') && !sure.includes('Saat') && !sure.includes('Dakika') && !sure.includes('Saniye')) {
      return interaction.reply({
        content: 'Geçersiz mesai süresi formatı.',
        ephemeral: true,
      });
    }

    let realTime = sure.replace('Gün', 'd').replace('Saat', 'h').replace('Dakika', 'm').replace('Saniye', 's');
    realTime = realTime.replace(' ', '');
    const timeArray = realTime.split(' ');
    let totalMs = 0;
    for (let i = 0; i < timeArray.length; i++) {
      if (timeArray[i].includes('d')) {
        totalMs += Number(timeArray[i].replace('d', '')) * 86400 * 1000;
      } else if (timeArray[i].includes('h')) {
        totalMs += Number(timeArray[i].replace('h', '')) * 3600 * 1000;
      } else if (timeArray[i].includes('m')) {
        totalMs += Number(timeArray[i].replace('m', '')) * 60 * 1000;
      } else if (timeArray[i].includes('s')) {
        totalMs += Number(timeArray[i].replace('s', '')) * 1000;
      }
    }

    let guild = interaction.client.guilds.cache.get(config.guild.id);
    let member = guild.members.cache.get(target.id);

    if (islem === 'ekle') {
      mesaiDurumu.toplamMesai += totalMs;
      await mesaiDurumu.save();

      const targetDmEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${config.settings.departmentName} Mesai Sistemi`,
          iconURL: config.settings.departmentLogo,
        })
        .setColor('Green')
        .setDescription(`🎉 Merhaba, <@${interaction.user.id}> tarafından mesai sürenize ekleme yapıldı. Eklenen süre: ${timeDifference2(totalMs)}`)
        .setImage(config.settings.departmentBanner);

      await target.send({ embeds: [targetDmEmbed] });

      const logChannel = interaction.client.channels.cache.get(config.settings.channels.log);
      const logEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${config.settings.departmentName} Mesai Ayarlama Log`,
          iconURL: config.settings.departmentLogo,
        })
        .setColor('Green')
        .setDescription(`📝 **Ayarı Yapan Yönetici:** <@${interaction.user.id}>\n👤 **Kullanıcı:** <@${target.id}>\n🏅 **Rozet:** ${getMemberBadge(member)}\n⏳ **Eklenen Süre:** +${sure}`)
        .setImage(config.settings.departmentBanner);

      logChannel.send({ embeds: [logEmbed] });

      await interaction.reply({
        content: 'Kullanıcının mesai süresi başarıyla eklendi.',
        ephemeral: true,
      });
    } else if (islem === 'cikar') {
      if (mesaiDurumu.toplamMesai < totalMs) {
        return interaction.reply({
          content: 'Kullanıcının mesai süresinden bu kadar çıkarılamaz.',
          ephemeral: true,
        });
      }
      mesaiDurumu.toplamMesai -= totalMs;
      await mesaiDurumu.save();

      const targetDmEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${config.settings.departmentName} Mesai Sistemi`,
          iconURL: config.settings.departmentLogo,
        })
        .setColor('Red')
        .setDescription(`⚠️ Merhaba, <@${interaction.user.id}> tarafından mesai sürenizden çıkarma yapıldı. Çıkarılan süre: ${timeDifference2(totalMs)}`)
        .setImage(config.settings.departmentBanner);

      await target.send({ embeds: [targetDmEmbed] });

      const logChannel = interaction.client.channels.cache.get(config.settings.channels.log);
      const logEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${config.settings.departmentName} Mesai Ayarlama Log`,
          iconURL: config.settings.departmentLogo,
        })
        .setColor('Red')
        .setDescription(`📝 **Ayarı Yapan Yönetici:** <@${interaction.user.id}>\n👤 **Kullanıcı:** <@${target.id}>\n🏅 **Rozet:** ${getMemberBadge(member)}\n⏳ **Çıkarılan Süre:** -${sure}`)
        .setImage(config.settings.departmentBanner);

      logChannel.send({ embeds: [logEmbed] });

      await interaction.reply({
        content: 'Kullanıcının mesai süresi başarıyla çıkarıldı.',
        ephemeral: true,
      });
    } else if (islem === 'duzelt') {
      mesaiDurumu.toplamMesai = totalMs;
      await mesaiDurumu.save();

      const targetDmEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${config.settings.departmentName} Mesai Sistemi`,
          iconURL: config.settings.departmentLogo,
        })
        .setColor('Blue')
        .setDescription(`🔄 Merhaba, <@${interaction.user.id}> tarafından mesai süreniz düzeltildi. Yeni toplam mesai süreniz: ${timeDifference2(totalMs)}`)
        .setImage(config.settings.departmentBanner);

      await target.send({ embeds: [targetDmEmbed] });

      const logChannel = interaction.client.channels.cache.get(config.settings.channels.log);
      const logEmbed = new EmbedBuilder()
        .setAuthor({
          name: `${config.settings.departmentName} Mesai Ayarlama Log`,
          iconURL: config.settings.departmentLogo,
        })
        .setColor('Blue')
        .setDescription(`📝 **Ayarı Yapan Yönetici:** <@${interaction.user.id}>\n👤 **Kullanıcı:** <@${target.id}>\n🏅 **Rozet:** ${getMemberBadge(member)}\n⏳ **Düzeltilen Süre:** ${sure}`)
        .setImage(config.settings.departmentBanner);

      logChannel.send({ embeds: [logEmbed] });

      await interaction.reply({
        content: 'Kullanıcının mesai süresi başarıyla düzeltildi.',
        ephemeral: true,
      });
    } else {
      return interaction.reply({
        content: 'Geçersiz işlem seçeneği.',
        ephemeral: true,
      });
    }
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
  var t = days + ' Gün ' + hours + ' Saat ' + minutes + ' Dakika ' + sec + ' Saniye';
  return t;
}

function getMemberBadge(member) {
  const roles = member.roles.cache
    .sort((a, b) => b.position - a.position)
    .values();
  for (const role of roles) {
    for (let i = 0; i < config.settings.roles.officers.length; i++) {
      if (role.id === config.settings.roles.officers[i]) {
        return `<@&${role.id}>`;
      }
    }
  }
  return 'Rozet bulunamadı.';
}
