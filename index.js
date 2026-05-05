require("dotenv").config();

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
} = require("discord.js");

console.log("🚀 Bot starting...");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ================= COMMANDS =================

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Shows control panel"),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open ticket panel"),
].map(cmd => cmd.toJSON());

// ================= REGISTER COMMANDS =================

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("⏳ Registering slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered!");
  } catch (err) {
    console.error("❌ Command registration failed:", err);
  }
}

// ================= READY =================

client.once(Events.ClientReady, async (c) => {
  console.log(`🤖 Logged in as ${c.user.tag}`);
  await registerCommands();
});

// ================= INTERACTIONS =================

client.on(Events.InteractionCreate, async (interaction) => {

  // SLASH COMMANDS
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "ping") {
      return interaction.reply("🏓 Pong!");
    }

    if (interaction.commandName === "panel") {
      return interaction.reply({
        content: "🎛️ Control Panel:\n/ping\n/panel\n/ticket",
        ephemeral: true,
      });
    }

    if (interaction.commandName === "ticket") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("create_ticket")
          .setLabel("🎫 Create Ticket")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        content: "Click below to create a support ticket:",
        components: [row],
      });
    }
  }

  // BUTTONS
  if (interaction.isButton()) {

    if (interaction.customId === "create_ticket") {

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
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
        ],
      });

      await interaction.reply({
        content: `✅ Ticket created: ${channel}`,
        ephemeral: true,
      });

      await channel.send(`🎫 Hello ${interaction.user}, support will assist you shortly.`);
    }
  }
});

// ================= LOGIN =================

client.login(process.env.TOKEN);
