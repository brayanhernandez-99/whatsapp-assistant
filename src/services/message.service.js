import logger from '../utils/logger.js';
import { extractPhoneFromJid } from '../utils/helpers.js';

const sendQueue = [];
let isProcessing = false;

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
      await sock.sendMessage(jid, content);
      logger.info({ to: extractPhoneFromJid(jid), type: Object.keys(content)[0] }, 'Mensaje enviado');
    } catch (error) {
      logger.error({ err: error, to: extractPhoneFromJid(jid) }, 'Error al enviar mensaje');
    }

    const delay = 1500 + Math.random() * 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  isProcessing = false;
}

export default { sendText, sendLocation };
