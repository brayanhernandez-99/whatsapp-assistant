import {
  displayQR,
  DisconnectReason,
  createWhatsAppConnection,
  cleanSession,
} from '../services/whatsapp.service.js';
import { initLidResolver } from '../services/lid-resolver.js';
import logger from '../utils/logger.js';

const RECONNECT_DELAY = 30_000;
const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_CONSECUTIVE_500 = 3;
let reconnectAttempt = 0;
let consecutive500Errors = 0;
let isReconnecting = false;

export function handleConnectionUpdate(deps, createMessageHandler) {
  return async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      displayQR(qr);
      reconnectAttempt = 0;
      consecutive500Errors = 0;
    }

    if (connection === 'connecting') {
      logger.info('Conectando a WhatsApp...');
    }

    if (connection === 'open') {
      logger.info('Conectado a WhatsApp exitosamente');
      reconnectAttempt = 0;
      consecutive500Errors = 0;
      isReconnecting = false;
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ statusCode, shouldReconnect }, 'Conexion cerrada');

      if (statusCode === 500) {
        consecutive500Errors++;
        if (consecutive500Errors >= MAX_CONSECUTIVE_500) {
          logger.info('Demasiados errores 500 consecutivos. Limpiando sesion corrupta...');
          cleanSession();
          reconnectAttempt = 0;
          consecutive500Errors = 0;
          isReconnecting = false;
          await attemptReconnect(deps, createMessageHandler);
          return;
        }
      } else {
        consecutive500Errors = 0;
      }

      if (shouldReconnect) {
        await attemptReconnect(deps, createMessageHandler);
      } else {
        logger.info('Sesion cerrada. Limpiando credenciales...');
        cleanSession();
        logger.info('Credenciales limpiadas. Reiniciando para generar nuevo QR...');
        reconnectAttempt = 0;
        consecutive500Errors = 0;
        isReconnecting = false;
        await attemptReconnect(deps, createMessageHandler);
      }
    }
  };
}

async function attemptReconnect(deps, createMessageHandler) {
  if (isReconnecting) return;
  isReconnecting = true;

  while (true) {
    if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      logger.fatal({ attempts: reconnectAttempt }, 'Maximo de intentos de reconexion alcanzado');
      isReconnecting = false;
      process.exit(1);
    }

    const delay = RECONNECT_DELAY;
    reconnectAttempt++;

    logger.info(`Reconectando en ${delay / 1000}s (intento ${reconnectAttempt})...`);

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      deps.sock.ev.removeAllListeners('messages.upsert');
      deps.sock.ev.removeAllListeners('connection.update');
      const newSock = await createWhatsAppConnection();
      deps.sock = newSock;

      initLidResolver(newSock);
      newSock.ev.on('connection.update', handleConnectionUpdate(deps, createMessageHandler));
      newSock.ev.on('messages.upsert', createMessageHandler(deps));

      logger.info('Reconectado y listeners re-attachados');
      isReconnecting = false;
      return;
    } catch (error) {
      logger.error({ err: error }, 'Error al reconectar');
    }
  }
}
