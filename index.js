const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ButtonBuilder, 
  ActionRowBuilder, 
  ButtonStyle 
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// ✅ عدادات التذاكر
let generalCount = 0;
let rpCount = 0;
let adminCount = 0;

// ✅ خريطة عشان ما يفتح العضو أكثر من شكوى
let activeTickets = new Map();

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// 📌 أمر لإرسال واجهة التذاكر (غير "ID_القناة" بالآيدي حق الروم اللي تبغى فيه الواجهة)
client.on("messageCreate", async (message) => {
  if (message.content === "!تذاكر") {
    if (!message.member.permissions.has("Administrator")) return;

    const embed = new EmbedBuilder()
      .setTitle("🎫 نظام التذاكر")
      .setDescription("اختر نوع الشكوى من الأزرار بالأسفل.\n\n> 📢 شكاوي عامة\n> 🎭 شكاوي RP\n> 🛡️ شكاوي الإدارة")
      .setColor(0x2F3136)
      .setImage("https://cdn.discordapp.com/attachments/1407427459837722665/1408113949957689478/logo.png")
      .setFooter({ text: "Ticket System V3.0 | جميع الحقوق محفوظة" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("general").setLabel("📢 شكاوي عامة").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("rp").setLabel("🎭 شكاوي RP").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("admin").setLabel("🛡️ شكاوي الإدارة").setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// 📌 استقبال الأزرار
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;

  // منع فتح أكثر من تذكرة
  if (interaction.customId === "general" || interaction.customId === "rp" || interaction.customId === "admin") {
    if (activeTickets.has(userId)) {
      return interaction.reply({ content: "⚠️ لديك تذكرة مفتوحة بالفعل. الرجاء إغلاقها قبل فتح أخرى.", ephemeral: true });
    }
  }

  let typeName = "";
  let ticketName = "";

  if (interaction.customId === "general") {
    generalCount++;
    typeName = "عام";
    ticketName = `شكوى-${typeName}-${generalCount}`;
  } else if (interaction.customId === "rp") {
    rpCount++;
    typeName = "RP";
    ticketName = `شكوى-${typeName}-${rpCount}`;
  } else if (interaction.customId === "admin") {
    adminCount++;
    typeName = "إدارة";
    ticketName = `شكوى-${typeName}-${adminCount}`;
  } else if (interaction.customId === "close_ticket") {
    if (!interaction.member.roles.cache.has("ايدي_رول_TicketManager")) {
      return interaction.reply({ content: "❌ فقط الإدارة يمكنهم إغلاق التذكرة.", ephemeral: true });
    }
    await interaction.channel.delete();
    activeTickets.delete(userId);
    return;
  } else {
    return;
  }

  // إنشاء الروم
  const channel = await interaction.guild.channels.create({
    name: ticketName,
    type: 0, // Text channel
    permissionOverwrites: [
      { id: interaction.guild.id, deny: ["ViewChannel"] },
      { id: userId, allow: ["ViewChannel", "SendMessages", "AttachFiles"] },
      { id: "ايدي_رول_TicketManager", allow: ["ViewChannel", "SendMessages", "ManageChannels"] }
    ]
  });

  activeTickets.set(userId, channel.id);

  await interaction.reply({ content: `✅ تم إنشاء تذكرتك: ${channel}`, ephemeral: true });

  // الاستمارة الاحترافية
  const embed = new EmbedBuilder()
    .setTitle(`📋 استمارة ${typeName}`)
    .setDescription(
      "**الرجاء الإجابة على الأسئلة التالية:**\n\n" +
      "1️⃣ ما تفاصيل الشكوى؟\n" +
      "2️⃣ متى حصلت المشكلة؟\n" +
      "3️⃣ من الأشخاص المعنيين؟\n" +
      "4️⃣ هل لديك أدلة (صور/فيديو)؟\n" +
      "5️⃣ أي تفاصيل إضافية؟\n\n" +
      "✍️ اكتب إجاباتك هنا وسنقوم بمراجعتها."
    )
    .setColor(0xFFD700)
    .setFooter({ text: "Ticket System V3.0 | جميع الحقوق محفوظة" })
    .setImage("https://cdn.discordapp.com/attachments/1407427459837722665/1408113949957689478/logo.png");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 إغلاق التذكرة")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({ content: `<@${userId}>`, embeds: [embed], components: [row] });
});

client.login("توكن_البوت");
