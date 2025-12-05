// bot.js - Chỉ xoá tin nhắn trong channel sellall sau 120s

const { Client, GatewayIntentBits } = require("discord.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const SELL_CHANNEL_ID = process.env.SELL_CHANNEL_ID;

// TTL xoá 120 giây
const DELETE_TTL_MS = 120 * 1000;

if (!TOKEN) {
  console.error("[BOT] Missing DISCORD_BOT_TOKEN");
  process.exit(1);
}
if (!SELL_CHANNEL_ID) {
  console.error("[BOT] Missing SELL_CHANNEL_ID");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  console.log(`[BOT] Watching channel: ${SELL_CHANNEL_ID}`);
});

client.on("messageCreate", (message) => {
  if (message.channel.id !== SELL_CHANNEL_ID) return;

  console.log(
    `[BOT] New message in sell channel: "${message.content}" from ${message.author.tag}`
  );

  setTimeout(() => {
    message
      .delete()
      .then(() =>
        console.log(
          `[BOT] Deleted message "${message.content}" after 120s (id=${message.id})`
        )
      )
      .catch((err) => {
        console.error("[BOT] Failed to delete message:", err.message);
      });
  }, DELETE_TTL_MS);
});

client
  .login(TOKEN)
  .catch((err) => {
    console.error("[BOT] Login failed:", err);
    process.exit(1);
  });
