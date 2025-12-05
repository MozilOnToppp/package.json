// bot.js
require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const SELL_CHANNEL_ID = process.env.SELL_CHANNEL_ID;
const COMMAND_PANEL_URL = process.env.COMMAND_PANEL_URL; // URL Railway web panel của ông
const COMMAND_KEY = process.env.COMMAND_KEY;

// Gửi lệnh về panel (nếu ông còn dùng /api/set-command)
async function sendSellCommandToPanel(username) {
  if (!COMMAND_PANEL_URL || !COMMAND_KEY) return;

  try {
    await fetch(`${COMMAND_PANEL_URL}/api/set-command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: username,
        cmd: "sellall",
        key: COMMAND_KEY,
      }),
    });
    console.log("[BOT] Đã gửi sellall tới panel cho:", username);
  } catch (err) {
    console.error("[BOT] Lỗi gọi panel:", err);
  }
}

client.on("messageCreate", async (message) => {
  // chỉ xem đúng channel sellall
  if (message.channelId !== SELL_CHANNEL_ID) return;

  // chỉ xử lý tin từ webhook (web của ông gửi)
  if (!message.webhookId) return;

  const content = (message.content || "").trim();
  const lower = content.toLowerCase();
  console.log("[BOT] Webhook msg:", content);

  if (!lower.startsWith(".sellall")) return;

  const parts = content.split(/\s+/);
  const username = parts[1];
  if (!username) return;

  // 1) Gửi lệnh sang panel (tuỳ usecase, không cần thì có thể bỏ)
  await sendSellCommandToPanel(username);

  // 2) Hẹn xoá message sau 60s
  setTimeout(() => {
    if (!message.deleted) {
      message
        .delete()
        .then(() => {
          console.log("[BOT] Đã xoá message sellall sau 60s:", content);
        })
        .catch(() => {});
    }
  }, 60_000);
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// LẤY TOKEN TỪ ENV ĐƠN GIẢN
const token = process.env.DISCORD_BOT_TOKEN;

if (!token || typeof token !== "string") {
  console.error("[BOT] DISCORD_BOT_TOKEN không tồn tại hoặc không hợp lệ.");
  process.exit(1);
}

console.log("[BOT] Starting login with token length:", token.length);

client.login(token);
