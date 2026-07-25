import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { loadSession } from './session.service.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const baileysLogger = pino({ level: 'silent' });

export async function createWhatsAppConnection() {
  const { state, saveCreds } = await loadSession();
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
    },
    printQRInTerminal: false,
    logger: baileysLogger,
    generateHighQualityLinkPreview: false,
  });

  sock.ev.on('creds.update', saveCreds);

  return sock;
}

export function displayQR(qr) {
  logger.info('QR recibido. Escanea con WhatsApp:');
  qrcode.generate(qr, { small: true });
}

export function cleanSession() {
  try {
    const files = readdirSync(env.SESSION_DIR);
    for (const file of files) {
      rmSync(join(env.SESSION_DIR, file), { force: true });
    }
    logger.info('Archivos de sesión eliminados');
  } catch (error) {
    logger.warn({ err: error }, 'Error al limpiar sesión');
  }
}

export { DisconnectReason };
