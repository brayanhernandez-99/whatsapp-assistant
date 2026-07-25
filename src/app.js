import env from './config/env.js';
import logger from './utils/logger.js';
import { createWhatsAppConnection, cleanSession } from './services/whatsapp.service.js';
import { handleConnectionUpdate } from './handlers/connection.handler.js';
import { createMessageHandler } from './handlers/message.handler.js';
import stateManager from './state/state.manager.js';
import { startAutoResume, stopAutoResume, resumeUser } from './state/paused-users.js';
import * as messageService from './services/message.service.js';
import { MESSAGES } from './utils/constants.js';
import { extractPhoneFromJid } from './utils/helpers.js';

function setupGracefulShutdown() {
  const shutdown = (signal) => {
    logger.info(`Señal ${signal} recibida. Limpiando sesión...`);
    stateManager.stopCleanup();
    stopAutoResume();
    cleanSession();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

async function start() {
  setupGracefulShutdown();

  logger.info({ botName: env.BOT_NAME, env: env.NODE_ENV }, 'Iniciando asistente');

  const sock = await createWhatsAppConnection();

  const deps = { stateManager, messageService, sock };

  stateManager.onSessionExpire(async (phone) => {
    try {
      resumeUser(phone);
      await messageService.sendText(sock, phone, MESSAGES.sessionTimeout);
      logger.info({ phone: extractPhoneFromJid(phone) }, 'Sesión expirada y bot reanudado');
    } catch (error) {
      logger.error({ err: error, phone: extractPhoneFromJid(phone) }, 'Error al enviar mensaje de expiración');
    }
  });

  stateManager.startCleanup();
  startAutoResume();

  sock.ev.on('connection.update', handleConnectionUpdate(deps, createMessageHandler));
  sock.ev.on('messages.upsert', createMessageHandler(deps));

  logger.info('Asistente en espera de mensajes...');
}

start().catch((error) => {
  logger.fatal({ err: error }, 'Error fatal al iniciar');
  process.exit(1);
});
