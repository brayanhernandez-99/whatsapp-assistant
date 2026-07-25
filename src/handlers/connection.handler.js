import { displayQR, DisconnectReason, createWhatsAppConnection, cleanSession } from '../services/whatsapp.service.js';
import logger from '../utils/logger.js';

const RECONNECT_DELAYS = [0, 5000, 15000, 30000, 60000, 120000, 180000, 300000];
let reconnectAttempt = 0;
let isReconnecting = false;

export function handleConnectionUpdate(deps, createMessageHandler) {
  return async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      displayQR(qr);
      reconnectAttempt = 0;
    }

    if (connection === 'connecting') {
      logger.info('Conectando a WhatsApp...');
    }

    if (connection === 'open') {
      logger.info('Conectado a WhatsApp exitosamente');
      reconnectAttempt = 0;
      isReconnecting = false;
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ statusCode, shouldReconnect }, 'Conexión cerrada');

      if (shouldReconnect) {
        await attemptReconnect(deps, createMessageHandler);
      } else {
        logger.info('Sesión cerrada. Limpiando credenciales...');
        cleanSession();
        logger.info('Credenciales limpiadas. Reiniciando para generar nuevo QR...');
        reconnectAttempt = 0;
        isReconnecting = false;
        await attemptReconnect(deps, createMessageHandler);
      }
    }
  };
}

async function attemptReconnect(deps, createMessageHandler) {
  if (isReconnecting) return;
  isReconnecting = true;

  const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
  reconnectAttempt++;

  logger.info(`Reconectando en ${delay / 1000}s (intento ${reconnectAttempt})...`);

  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    deps.sock.ev.removeAllListeners();
    const newSock = await createWhatsAppConnection();
    deps.sock = newSock;

    newSock.ev.on('connection.update', handleConnectionUpdate(deps, createMessageHandler));
    newSock.ev.on('messages.upsert', createMessageHandler(deps));

    logger.info('Reconectado y listeners re-attachados');
    isReconnecting = false;
  } catch (error) {
    logger.error({ err: error }, 'Error al reconectar');
    isReconnecting = false;
    await attemptReconnect(deps, createMessageHandler);
  }
}
