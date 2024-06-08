const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Mazeret } = require('../utils/database');
const config = require('../settings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mazeretsil')
    .setDescription('Belirtilen kullanıcının belirtilen mazeretini siler.')
    .addUserOption(option => 
      option.setName('kullanici')
        .setDescription('Mazereti silinecek kullanıcı.')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('numara')
        .setDescription('Silinecek mazeretin numarası.')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: 'Bu komutu kullanabilmek için yetkiniz yok.',
        ephemeral: true,
      });
    }

    const kullanici = interaction.options.getUser('kullanici');
    const numara = interaction.options.getInteger('numara');

    const mazeretler = await Mazeret.find({ userID: kullanici.id });

    if (numara < 1 || numara > mazeretler.length) {
      return interaction.reply({
        content: 'Geçersiz mazeret numarası.',
        ephemeral: true,
      });
    }

    const mazeret = mazeretler[numara - 1];
    await Mazeret.deleteOne({ _id: mazeret._id });

    await interaction.reply({
      content: `${kullanici} kullanıcısının ${numara}. mazereti başarıyla silindi.`,
      ephemeral: true,
    });
  }
};
