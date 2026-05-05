require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
  Collection,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.commands = new Collection();

// ================= COMMANDS =================

client.commands.set("ping", {
  execute: async (interaction) => {
    await interaction.reply("🏓 Pong!");
  },
});

client.commands.set("panel", {
  execute: async (interaction) => {
    await interaction.reply({
      content: "🎛️ Control Panel:\n/ping\n/panel\n/ticket",
      ephemeral: true
    });
  },
});

client.commands.set("ticket", {
  execute: async (interaction) => {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("🎫 Create Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: "🎫 Click below to create a support ticket",
      components: [row]
    });
  }
});

// ================= READY =================

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// ================= INTERACTIONS =================

client.on(Events.InteractionCreate, async (interaction) => {

  // Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: "❌ Error executing command", ephemeral: true });
    }
  }

  // Buttons
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
            allow: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });

      await interaction.reply({
        content: `✅ Ticket created: ${channel}`,
        ephemeral: true
      });

      await channel.send(`🎫 Welcome ${interaction.user}, support will be with you shortly.`);
    }
  }
});

// ================= LOGIN =================

client.login(process.env.TOKEN);
