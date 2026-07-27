import logger from '../utils/logger.js';
import { extractPhoneFromJid } from '../utils/helpers.js';
import env from '../config/env.js';

const CLEANUP_INTERVAL = 60 * 1000;

const states = new Map();
const timestamps = new Map();
let onExpireCallback = null;
let cleanupTimer = null;

function getState(phone) {
  if (!states.has(phone)) {
    return { currentMenu: 'main', previousMenu: null, selectedOption: null, context: {} };
  }

  return states.get(phone);
}

function setState(phone, newState) {
  states.set(phone, newState);
  timestamps.set(phone, Date.now());
  logger.debug(
    { phone: extractPhoneFromJid(phone), menu: newState.currentMenu },
    'Estado actualizado',
  );
}

function hasState(phone) {
  return states.has(phone);
}

function onSessionExpire(callback) {
  onExpireCallback = callback;
}

function cleanExpiredStates() {
  const now = Date.now();
  const expired = [];

  for (const [phone, timestamp] of timestamps) {
    if (now - timestamp > env.SESSION_TIMEOUT * 60 * 1000) {
      expired.push(phone);
    }
  }

  for (const phone of expired) {
    states.delete(phone);
    timestamps.delete(phone);
    logger.info({ phone: extractPhoneFromJid(phone) }, 'Sesion expirada por inactividad');

    if (onExpireCallback) {
      try {
        onExpireCallback(phone);
      } catch (error) {
        logger.error(
          { err: error, phone: extractPhoneFromJid(phone) },
          'Error en callback de expiracion',
        );
      }
    }
  }
}

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(cleanExpiredStates, CLEANUP_INTERVAL);
  logger.debug('Cleanup de sesiones iniciado');
}

function stopCleanup() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

export default {
  getState,
  setState,
  hasState,
  onSessionExpire,
  startCleanup,
  stopCleanup,
};
