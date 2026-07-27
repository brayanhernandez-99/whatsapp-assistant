import { isJidUser, isLidUser } from '@whiskeysockets/baileys';
import logger from '../utils/logger.js';

const lidToPhoneMap = new Map();

function extractUser(jid) {
  if (!jid) return null;
  return jid.split('@')[0] || null;
}

function toPhoneJid(phone) {
  return `${phone}@s.whatsapp.net`;
}

export function initLidResolver(sock) {
  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.senderLid && msg.key.senderPn) {
        const lidUser = extractUser(msg.key.senderLid);
        const phoneUser = extractUser(msg.key.senderPn);
        if (lidUser && phoneUser) {
          if (!lidToPhoneMap.has(lidUser)) {
            logger.debug({ lid: lidUser, phone: phoneUser }, 'Mapeo LID-Telefono descubierto');
          }
          lidToPhoneMap.set(lidUser, phoneUser);
        }
      }
    }
  });

  sock.ev.on('chats.phoneNumberShare', ({ lid, jid }) => {
    const lidUser = extractUser(lid);
    const phoneUser = extractUser(jid);
    if (lidUser && phoneUser) {
      logger.info({ lid: lidUser, phone: phoneUser }, 'Mapeo LID-Telefono por comparticion');
      lidToPhoneMap.set(lidUser, phoneUser);
    }
  });

  logger.info('Resolvedor de LID inicializado');
}

export function resolveJid(jid, messageKey, fromMe = false) {
  if (!jid) return null;

  if (isJidUser(jid)) {
    return jid;
  }

  if (isLidUser(jid)) {
    if (!fromMe && messageKey?.senderPn) {
      if (isJidUser(messageKey.senderPn)) return messageKey.senderPn;
      const phone = extractUser(messageKey.senderPn);
      if (phone) return toPhoneJid(phone);
    }

    const lidUser = extractUser(jid);
    const mapped = lidToPhoneMap.get(lidUser);
    if (mapped) return toPhoneJid(mapped);
  }

  if (!jid.includes('@')) {
    return toPhoneJid(jid);
  }

  return jid;
}
