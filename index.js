require("dotenv").config();

console.log("🚀 BOT FILE STARTED");

console.log("TOKEN:", !!process.env.TOKEN);
console.log("CLIENT_ID:", !!process.env.CLIENT_ID);

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log("🤖 Logged in as", client.user.tag);
});

client.login(process.env.TOKEN);
