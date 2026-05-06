require("dotenv").config();
const fs = require("fs");

const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

process.on("unhandledRejection", (err) => {
  console.log("⚠️ Error:", err);
});

console.log("🚀 Final Bot Starting...");

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ================= MEMORY =================
const ticketActivity = new Map();

// ================= COMMANDS =================
const commands = [

  // BASIC
  new SlashCommandBuilder().setName("ping").setDescription("Check bot"),
  new SlashCommandBuilder().setName("panel").setDescription("Control panel"),
  new SlashCommandBuilder().setName("ticket").setDescription("Open ticket system"),

  // MODERATION
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout user (10 min)")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete messages")
    .addIntegerOption(o =>
      o.setName("amount").setDescription("Number").setRequired(true)
    ),

].map(c => c.toJSON());

// ================= REGISTER COMMANDS =================
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("✅ Commands registered");
}

// ================= READY =================
client.once(Events.ClientReady, async (c) => {
  console.log(`🤖 Logged in as ${c.user.tag}`);
  await registerCommands();
});

// ================= WELCOME SYSTEM =================
client.on(Events.GuildMemberAdd, async (member) => {
  const channel = member.guild.systemChannel;

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("👋 Welcome!")
    .setDescription(`Welcome ${member.user.tag} to **${member.guild.name}**`)
    .setColor(0x00ff99);

  channel.send({ embeds: [embed] });
});

// ================= TICKET TRANSCRIPT =================
async function createTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 50 });

  let log = `Transcript: ${channel.name}\n\n`;

  messages.reverse().forEach(m => {
    log += `${m.author.tag}: ${m.content}\n`;
  });

  const file = `transcript-${channel.id}.txt`;
  fs.writeFileSync(file, log);

  return file;
}

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // ================= BASIC =================
  if (commandName === "ping") {
    return interaction.reply("🏓 Pong!");
  }

  if (commandName === "panel") {
    return interaction.reply({
      content:
        "⚙️ **Bot Panel**\n\n" +
        "🛡 Moderation enabled\n" +
        "🎫 Ticket system active\n" +
        "👋 Welcome system active",
      ephemeral: true,
    });
  }

  if (commandName === "ticket") {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_create")
        .setLabel("🎫 Create Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: "Click below to open a ticket:",
      components: [row],
    });
  }

  // ================= MODERATION =================
  if (commandName === "kick") {
    const user = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(user.id);

    await member.kick();
    return interaction.reply(`👢 Kicked ${user.tag}`);
  }

  if (commandName === "ban") {
    const user = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(user.id);

    await member.ban();
    return interaction.reply(`🔨 Banned ${user.tag}`);
  }

  if (commandName === "timeout") {
    const user = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(user.id);

    await member.timeout(10 * 60 * 1000);
    return interaction.reply(`⏳ Timed out ${user.tag}`);
  }

  if (commandName === "clear") {
    const amount = interaction.options.getInteger("amount");

    const msgs = await interaction.channel.bulkDelete(amount, true);
    return interaction.reply({
      content: `🧹 Deleted ${msgs.size} messages`,
      ephemeral: true,
    });
  }
});

// ================= BUTTON SYSTEM =================
client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.isButton()) return;

  // ===== CREATE TICKET =====
  if (interaction.customId === "ticket_create") {

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ],
    });

    ticketActivity.set(channel.id, Date.now());

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Close Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket Opened")
      .setDescription(`Hello ${interaction.user}, explain your issue.`)
      .setColor(0x00ffcc);

    await interaction.reply({
      content: `Ticket created: ${channel}`,
      ephemeral: true,
    });

    await channel.send({ embeds: [embed], components: [row] });
  }

  // ===== CLOSE TICKET =====
  if (interaction.customId === "close_ticket") {

    await interaction.reply("🔒 Closing ticket...");

    const file = await createTranscript(interaction.channel);

    try {
      await interaction.user.send({
        content: "📄 Transcript:",
        files: [file],
      });
    } catch {}

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 4000);
  }
});

// ================= MESSAGE INTERACTIONS =================
client.on("messageCreate", async (message) => {

  if (!message.channel.name?.startsWith("ticket-")) return;
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();

  // simple interaction system
  if (msg.includes("hello") || msg.includes("hi")) {
    return message.reply("👋 Hello! How can I help you?");
  }

  if (msg.includes("help")) {
    return message.reply("🛠 Tell me your issue and I’ll assist you.");
  }

  if (msg.includes("slow")) {
    return message.reply("⚡ I’ll try to speed things up for you.");
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
