import { routeMessage } from '../router/command.router.js';
import {
  extractMessageBody,
  extractMessageType,
  isGroupJid,
  extractPhoneFromJid,
} from '../utils/helpers.js';
import { isPaused, pauseUser, trackAgentActivity } from '../state/paused-users.js';
import logger from '../utils/logger.js';

export function createMessageHandler(deps) {
  return async (messageUpdate) => {
    const { messages, type } = messageUpdate;

    if (type !== 'notify') return;

    for (const message of messages) {
      try {
        const jid = message.key.remoteJid;

        if (message.key.fromMe) {
          if (!jid || isGroupJid(jid)) continue;

          if (isPaused(jid)) {
            trackAgentActivity(jid);
            logger.info({ from: extractPhoneFromJid(jid) }, 'Timer de asesor reiniciado');
            continue;
          }

          if (!isPaused(jid)) {
            pauseUser(jid, true);
            logger.info({ from: extractPhoneFromJid(jid) }, 'Bot pausado automáticamente (asesor escribió)');
            continue;
          }
        }

        if (!jid || isGroupJid(jid)) continue;

        const content = message.message;
        const body = extractMessageBody(content);
        const msgType = extractMessageType(content);

        const parsed = {
          from: jid,
          pushName: message.pushName || 'Desconocido',
          body,
          type: msgType,
        };

        logger.info(
          {
            from: extractPhoneFromJid(parsed.from),
            name: parsed.pushName,
            type: parsed.type,
            body: parsed.body || '(sin texto)',
          },
          'Mensaje recibido',
        );

        if (isPaused(parsed.from)) {
          logger.debug({ from: extractPhoneFromJid(parsed.from) }, 'Mensaje ignorado (bot pausado)');
          continue;
        }

        await routeMessage(parsed, deps);
      } catch (error) {
        logger.error({ err: error, from: extractPhoneFromJid(message.key.remoteJid) }, 'Error al procesar mensaje');
      }
    }
  };
}
