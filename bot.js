// bot.js - Bot đọc channel sellall & set lệnh về web (Railway B)
const { Client, GatewayIntentBits, Partials } = require("discord.js");

// ===== ENV =====
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const SELL_CHANNEL_ID = process.env.SELL_CHANNEL_ID; // ID channel nhận .sellall ...
const COMMAND_PANEL_URL = process.env.COMMAND_PANEL_URL; // URL web Railway A
const COMMAND_KEY = process.env.COMMAND_KEY; // trùng với web

// TTL xoá message sau 60s
const SELL_TTL_MS = 60 * 1000;

if (!DISCORD_BOT_TOKEN) {
  console.error("Missing DISCORD_BOT_TOKEN env");
  process.exit(1);
}
if (!SELL_CHANNEL_ID) {
  console.error("Missing SELL_CHANNEL_ID env");
  process.exit(1);
}
if (!COMMAND_PANEL_URL) {
  console.error("Missing COMMAND_PANEL_URL env");
  process.exit(1);
}
if (!COMMAND_KEY) {
  console.error("Missing COMMAND_KEY env");
  process.exit(1);
}

// ===== Discord client =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// Helper: gọi web /api/set-command
async function sendSellCommandToPanel(username) {
  const url = new URL("/api/set-command", COMMAND_PANEL_URL).toString();

  const payload = {
    user: username,
    cmd: "sellall",
    key: COMMAND_KEY,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Panel error ${resp.status}: ${text}`);
  }
}

client.once("ready", () => {
  console.log(
    `[BOT] Logged in as ${client.user.tag}. Watching channel ${SELL_CHANNEL_ID}`
  );
});

client.on("messageCreate", async (message) => {
  try {
    // chỉ quan tâm đúng channel
    if (message.channel.id !== SELL_CHANNEL_ID) return;

    const content = (message.content || "").trim();

    if (!content) return;

    // debug nhỏ để check bot đã đọc được tin
    console.log(`[BOT] Message in sell channel: "${content}"`);

    // match ".sellall username"
    const match = content.match(/^\.sellall\s+([^\s]+)$/i);
    if (!match) return;

    const username = match[1];

    console.log(`[BOT] Detected sellall for user: ${username}`);

    try {
      await sendSellCommandToPanel(username);
      console.log(`[BOT] Sent sell command to panel for ${username}`);
    } catch (err) {
      console.error(
        `[BOT] Failed to call panel for user ${username}:`,
        err.message
      );
      // không xoá message để còn log nếu lỗi
      return;
    }

    // Schedule xoá message sau 60s
    setTimeout(() => {
      message
        .delete()
        .then(() =>
          console.log(`[BOT] Deleted sellall message for ${username}`)
        )
        .catch(() => {
          // ignore lỗi (VD quyền thiếu)
        });
    }, SELL_TTL_MS);
  } catch (err) {
    console.error("[BOT] Error in messageCreate handler:", err);
  }
});

client
  .login(DISCORD_BOT_TOKEN)
  .catch((err) => {
    console.error("Failed to login Discord bot:", err);
    process.exit(1);
  });
