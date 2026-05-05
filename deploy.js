require("dotenv").config();
const { REST, Routes } = require("discord.js");

const commands = [
  { name: "ping", description: "Ping test" },
  { name: "panel", description: "Open panel" }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("✅ Commands deployed");
})();
