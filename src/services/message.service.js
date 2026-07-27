import logger from '../utils/logger.js';
import { extractPhoneFromJid } from '../utils/helpers.js';

const sendQueue = [];
let isProcessing = false;

const botSentMessages = new Set();
const BOT_MESSAGES_MAX = 500;

function markBotSentMessage(messageId) {
  if (botSentMessages.size >= BOT_MESSAGES_MAX) {
    const first = botSentMessages.values().next().value;
    botSentMessages.delete(first);
  }
  botSentMessages.add(messageId);
}

export function isBotSentMessage(messageId) {
  if (botSentMessages.has(messageId)) {
    botSentMessages.delete(messageId);
    return true;
  }
  return false;
}

export async function sendText(sock, jid, text) {
  await enqueue(sock, jid, { text });
}

export async function sendLocation(sock, jid, latitude, longitude) {
  await enqueue(sock, jid, { location: { latitude, longitude } });
}

async function enqueue(sock, jid, content) {
  sendQueue.push({ sock, jid, content });
  await processQueue();
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (sendQueue.length > 0) {
    const { sock, jid, content } = sendQueue.shift();

    try {
      const result = await sock.sendMessage(jid, content);
      if (result?.key?.id) markBotSentMessage(result.key.id);
      logger.info(
        { to: extractPhoneFromJid(jid), type: Object.keys(content)[0] },
        'Mensaje enviado',
      );
    } catch (error) {
      logger.error({ err: error, to: extractPhoneFromJid(jid) }, 'Error al enviar mensaje');
    }

    const delay = 1500 + Math.random() * 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  isProcessing = false;
}
