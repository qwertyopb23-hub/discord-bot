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
} = require("discord.js");

// ================= SAFETY =================
process.on("unhandledRejection", (err) => {
  console.log("⚠️ Error:", err);
});

console.log("🚀 Pro Bot Starting...");

// ================= CLIENT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ================= COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot status"),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Open control panel"),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open ticket system"),
].map(c => c.toJSON());

// ================= REGISTER COMMANDS =================
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("⏳ Registering commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commands registered!");
  } catch (err) {
    console.log("❌ Command error:", err);
  }
}

// ================= READY =================
client.once(Events.ClientReady, async (c) => {
  console.log(`🤖 Logged in as ${c.user.tag}`);
  await registerCommands();
});

// ================= TICKET TRANSCRIPT =================
async function createTranscript(channel) {
  let messages = await channel.messages.fetch({ limit: 100 });

  let log = `Transcript for ${channel.name}\n\n`;

  messages.reverse().forEach(m => {
    log += `${m.author.tag}: ${m.content}\n`;
  });

  const fileName = `transcript-${channel.id}.txt`;
  fs.writeFileSync(fileName, log);

  return fileName;
}

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async (interaction) => {

  // ===== SLASH COMMANDS =====
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "ping") {
      return interaction.reply("🏓 Pong!");
    }

    if (interaction.commandName === "panel") {
      return interaction.reply({
        content:
          "🎛️ **PRO PANEL**\n\n" +
          "• /ping\n" +
          "• /ticket\n\n" +
          "Tickets include transcripts + auto-close",
        ephemeral: true,
      });
    }

    if (interaction.commandName === "ticket") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_support")
          .setLabel("🛠 Support")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("ticket_billing")
          .setLabel("💰 Billing")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("ticket_report")
          .setLabel("🚨 Report")
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({
        content: "🎫 Select ticket type:",
        components: [row],
      });
    }
  }

  // ===== BUTTONS =====
  if (interaction.isButton()) {

    let type = "general";

    if (interaction.customId === "ticket_support") type = "support";
    if (interaction.customId === "ticket_billing") type = "billing";
    if (interaction.customId === "ticket_report") type = "report";

    // CREATE TICKET
    if (interaction.customId.startsWith("ticket_")) {

      const channel = await interaction.guild.channels.create({
        name: `ticket-${type}-${interaction.user.username}`,
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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Close Ticket")
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({
        content: `✅ Ticket created: ${channel}`,
        ephemeral: true,
      });

      await channel.send({
        content: `🎫 ${interaction.user} opened a **${type.toUpperCase()}** ticket.`,
        components: [row],
      });
    }

    // CLOSE + TRANSCRIPT
    if (interaction.customId === "close_ticket") {

      await interaction.reply("🔒 Closing ticket + generating transcript...");

      const file = await createTranscript(interaction.channel);

      try {
        await interaction.user.send({
          content: "📄 Here is your ticket transcript:",
          files: [file],
        });
      } catch (e) {
        console.log("DM failed");
      }

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
