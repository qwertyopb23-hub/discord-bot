require("dotenv").config();
const { REST, Routes } = require("discord.js");

const commands = [
  { name: "ping", description: "Ping test" },
  { name: "panel", description: "Open panel" },
  { name: "ticket", description: "Create ticket panel" }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commands deployed");
  } catch (err) {
    console.error(err);
  }
})();
