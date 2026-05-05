require("dotenv").config();

const { Client, GatewayIntentBits, Events, Collection } = require("discord.js");

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
      content: "🎛️ Bot is working!",
      ephemeral: true
    });
  },
});

// ================= READY =================

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// ================= INTERACTION HANDLER =================

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "❌ Error executing command",
      ephemeral: true
    });
  }
});

// ================= LOGIN =================

client.login(process.env.TOKEN);
