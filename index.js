const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  Events,
  ActivityType
} = require("discord.js");

require("dotenv").config();

// ================= CLIENT =================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= CONFIG =================

const CATEGORY_ID = "PUT_CATEGORY_ID";
const STAFF_ROLE_ID = "PUT_STAFF_ROLE_ID";
const LOG_CHANNEL_ID = "PUT_LOG_CHANNEL_ID";

// ================= SLASH COMMANDS =================

const commands = [

  // PANEL
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Send ticket panel"),

  // PING
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency"),

  // SAY
  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make bot say something")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Message")
        .setRequired(true)
    ),

  // KICK
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason")
    ),

  // BAN
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason")
    ),

  // CLEAR
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete messages")
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("1-100")
        .setRequired(true)
    ),

  // LOCK
  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock channel"),

  // UNLOCK
  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock channel"),

].map(cmd => cmd.toJSON());

// ================= READY =================

client.once("ready", async () => {

  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("✅ Slash commands loaded");

  } catch (err) {
    console.log(err);
  }

  client.user.setPresence({
    activities: [
      {
        name: "Pro Ticket System",
        type: ActivityType.Watching
      }
    ],
    status: "online"
  });

});

// ================= WELCOME SYSTEM =================

client.on(Events.GuildMemberAdd, async member => {

  const channel = member.guild.systemChannel;

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("👋 Welcome")
    .setDescription(`Welcome ${member} to **${member.guild.name}**`)
    .setThumbnail(member.user.displayAvatarURL())
    .setColor("Green")
    .setTimestamp();

  channel.send({ embeds: [embed] });

});

// ================= INTERACTION SYSTEM =================

client.on(Events.InteractionCreate, async interaction => {

  // ================= COMMANDS =================

  if (interaction.isChatInputCommand()) {

    // ================= PANEL =================

    if (interaction.commandName === "panel") {

      const embed = new EmbedBuilder()
        .setTitle("🎫 Support Center")
        .setDescription(
          "Need help?\n\nClick the button below to create a support ticket."
        )
        .setColor("Blue")
        .setFooter({
          text: interaction.guild.name
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("create_ticket")
          .setLabel("Create Ticket")
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }

    // ================= PING =================

    if (interaction.commandName === "ping") {

      return interaction.reply(
        `🏓 Pong: ${client.ws.ping}ms`
      );
    }

    // ================= SAY =================

    if (interaction.commandName === "say") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return interaction.reply({
          content: "❌ No permission",
          ephemeral: true
        });
      }

      const msg = interaction.options.getString("message");

      await interaction.channel.send(msg);

      return interaction.reply({
        content: "✅ Sent",
        ephemeral: true
      });
    }

    // ================= CLEAR =================

    if (interaction.commandName === "clear") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return interaction.reply({
          content: "❌ No permission",
          ephemeral: true
        });
      }

      const amount = interaction.options.getInteger("amount");

      if (amount < 1 || amount > 100) {
        return interaction.reply({
          content: "❌ Choose 1-100",
          ephemeral: true
        });
      }

      await interaction.channel.bulkDelete(amount, true);

      return interaction.reply({
        content: `✅ Deleted ${amount} messages`,
        ephemeral: true
      });
    }

    // ================= KICK =================

    if (interaction.commandName === "kick") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return interaction.reply({
          content: "❌ No permission",
          ephemeral: true
        });
      }

      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason";

      const member = interaction.guild.members.cache.get(user.id);

      if (!member) {
        return interaction.reply("❌ User not found");
      }

      await member.kick(reason);

      return interaction.reply(
        `✅ Kicked ${user.tag}\nReason: ${reason}`
      );
    }

    // ================= BAN =================

    if (interaction.commandName === "ban") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return interaction.reply({
          content: "❌ No permission",
          ephemeral: true
        });
      }

      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason";

      const member = interaction.guild.members.cache.get(user.id);

      if (!member) {
        return interaction.reply("❌ User not found");
      }

      await member.ban({ reason });

      return interaction.reply(
        `✅ Banned ${user.tag}\nReason: ${reason}`
      );
    }

    // ================= LOCK =================

    if (interaction.commandName === "lock") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({
          content: "❌ No permission",
          ephemeral: true
        });
      }

      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.id,
        {
          SendMessages: false
        }
      );

      return interaction.reply("🔒 Channel locked");
    }

    // ================= UNLOCK =================

    if (interaction.commandName === "unlock") {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({
          content: "❌ No permission",
          ephemeral: true
        });
      }

      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.id,
        {
          SendMessages: true
        }
      );

      return interaction.reply("🔓 Channel unlocked");
    }

  }

  // ================= BUTTON SYSTEM =================

  if (interaction.isButton()) {

    // ================= CREATE TICKET =================

    if (interaction.customId === "create_ticket") {

      const existing = interaction.guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.username.toLowerCase()}`
      );

      if (existing) {
        return interaction.reply({
          content: `❌ You already have a ticket: ${existing}`,
          ephemeral: true
        });
      }

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: CATEGORY_ID,

        permissionOverwrites: [

          {
            id: interaction.guild.id,
            deny: [
              PermissionsBitField.Flags.ViewChannel
            ]
          },

          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.AttachFiles
            ]
          },

          {
            id: STAFF_ROLE_ID,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          }

        ]
      });

      const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Opened")
        .setDescription(
          "Support will assist you shortly.\nPress the button below to close this ticket."
        )
        .setColor("Green")
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Close Ticket")
          .setEmoji("🔒")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `${interaction.user} <@&${STAFF_ROLE_ID}>`,
        embeds: [embed],
        components: [row]
      });

      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

      if (logChannel) {
        logChannel.send(
          `📁 Ticket created by ${interaction.user.tag}`
        );
      }

      return interaction.reply({
        content: `✅ Ticket created: ${channel}`,
        ephemeral: true
      });
    }

    // ================= CLOSE TICKET =================

    if (interaction.customId === "close_ticket") {

      await interaction.reply(
        "🗑️ Ticket closing in 5 seconds..."
      );

      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

      if (logChannel) {
        logChannel.send(
          `❌ Ticket closed by ${interaction.user.tag}`
        );
      }

      setTimeout(() => {
        interaction.channel.delete().catch(console.error);
      }, 5000);
    }

  }

});

// ================= AUTO MODERATION =================

client.on("messageCreate", async message => {

  if (message.author.bot) return;

  const badWords = [
    "badword1",
    "badword2"
  ];

  if (
    badWords.some(word =>
      message.content.toLowerCase().includes(word)
    )
  ) {

    await message.delete();

    message.channel.send(
      `⚠️ ${message.author}, watch your language`
    );

  }

});

// ================= ERROR HANDLER =================

process.on("unhandledRejection", error => {
  console.log(error);
});

process.on("uncaughtException", error => {
  console.log(error);
});

// ================= LOGIN =================

client.login(process.env.TOKEN);
