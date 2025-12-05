require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

// ===== ENV =====
const TOKEN          = process.env.DISCORD_BOT_TOKEN;
const SELL_CHANNEL_ID = process.env.SELL_CHANNEL_ID;      // 1438901899184050328
const SELL_TTL_SECONDS = Number(process.env.SELL_TTL_SECONDS || 120);

if (!TOKEN) {
  console.error('[BOT] Thiếu DISCORD_BOT_TOKEN trong env!');
  process.exit(1);
}
if (!SELL_CHANNEL_ID) {
  console.error('[BOT] Thiếu SELL_CHANNEL_ID trong env!');
  process.exit(1);
}

console.log('[BOT] START with config:', {
  SELL_CHANNEL_ID,
  SELL_TTL_SECONDS
});

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.once('ready', () => {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
});

// Mỗi message trong channel SELL_CHANNEL_ID sẽ được set timer để xoá
client.on('messageCreate', async (msg) => {
  try {
    // Chỉ care đúng channel sellall
    if (msg.channel.id !== SELL_CHANNEL_ID) return;

    console.log(
      `[SEEN] ${msg.id} in #${msg.channel.name} from ${msg.author.tag}: "${msg.content}"`
    );

    // Nếu bạn chỉ muốn xoá message có .sellall thì bật đoạn dưới:
    // if (!msg.content.toLowerCase().startsWith('.sellall')) return;

    const delayMs = SELL_TTL_SECONDS * 1000;

    setTimeout(async () => {
      try {
        // fetch lại để chắc chắn message còn tồn tại
        const channel = await client.channels.fetch(SELL_CHANNEL_ID);
        if (!channel || !channel.isTextBased()) {
          console.log('[CLEANUP] Không fetch được channel, bỏ qua.');
          return;
        }

        const toDelete = await channel.messages.fetch(msg.id).catch(() => null);
        if (!toDelete) {
          console.log(`[CLEANUP] Msg ${msg.id} đã bị xoá trước rồi.`);
          return;
        }

        await toDelete.delete();
        console.log(
          `[CLEANUP] Deleted msg ${msg.id} sau ${SELL_TTL_SECONDS}s: "${msg.content}"`
        );
      } catch (err) {
        console.error('[CLEANUP] Lỗi xoá msg', msg.id, err.rawError || err);
      }
    }, delayMs);
  } catch (err) {
    console.error('[messageCreate ERROR]', err);
  }
});

client
  .login(TOKEN)
  .catch((err) => {
    console.error('[BOT] Login failed:', err);
    process.exit(1);
  });
