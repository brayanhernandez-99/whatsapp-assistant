import { routeMessage } from '../router/command.router.js';
import {
  extractMessageBody,
  extractMessageType,
  isGroupJid,
  extractPhoneFromJid,
} from '../utils/helpers.js';
import { isPaused, pauseUser, trackAgentActivity } from '../state/paused-users.js';
import { resolveJid } from '../services/lid-resolver.js';
import { isBotSentMessage } from '../services/message.service.js';
import logger from '../utils/logger.js';

export function createMessageHandler(deps) {
  return async (messageUpdate) => {
    const { messages, type } = messageUpdate;

    if (type !== 'notify') return;

    for (const message of messages) {
      let jid = null;
      try {
        const rawJid = message.key.remoteJid;

        if (!rawJid || isGroupJid(rawJid)) continue;

        jid = resolveJid(rawJid, message.key, !!message.key.fromMe);

        if (!jid) {
          logger.warn({ rawJid }, 'No se pudo resolver JID, ignorando mensaje');
          continue;
        }

        if (message.key.fromMe) {
          if (isBotSentMessage(message.key.id)) {
            continue;
          }

          if (isPaused(jid)) {
            trackAgentActivity(jid);
            logger.info({ from: extractPhoneFromJid(jid) }, 'Timer de asesor reiniciado');
            continue;
          }

          pauseUser(jid, true);
          logger.info(
            { from: extractPhoneFromJid(jid) },
            'Bot pausado automaticamente (asesor escribio)',
          );
          continue;
        }

        const content = message.message;

        const parsed = {
          from: jid,
          pushName: message.pushName || 'Desconocido',
          body: extractMessageBody(content),
          type: extractMessageType(content),
        };

        if (isPaused(parsed.from)) {
          logger.debug(
            { from: extractPhoneFromJid(parsed.from) },
            'Mensaje ignorado (bot pausado)',
          );
          continue;
        }

        logger.info(
          {
            from: extractPhoneFromJid(parsed.from),
            name: parsed.pushName,
            type: parsed.type,
            body: parsed.body || '(sin texto)',
          },
          'Mensaje recibido',
        );

        routeMessage(parsed, deps);
      } catch (error) {
        logger.error(
          {
            err: error,
            from: extractPhoneFromJid(jid),
          },
          'Error al procesar mensaje',
        );
      }
    }
  };
}
