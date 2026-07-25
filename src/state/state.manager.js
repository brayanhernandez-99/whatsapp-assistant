import { TIMEOUTS } from '../utils/constants.js';
import logger from '../utils/logger.js';
import { extractPhoneFromJid } from '../utils/helpers.js';

const states = new Map();
const timestamps = new Map();
let onExpireCallback = null;
let cleanupTimer = null;

export function getState(phone) {
  if (!states.has(phone)) {
    return { currentMenu: 'main', previousMenu: null, selectedOption: null, context: {} };
  }

  return states.get(phone);
}

export function setState(phone, newState) {
  states.set(phone, newState);
  timestamps.set(phone, Date.now());
  logger.debug({ phone: extractPhoneFromJid(phone), menu: newState.currentMenu }, 'Estado actualizado');
}

export function hasState(phone) {
  return states.has(phone);
}

export function onSessionExpire(callback) {
  onExpireCallback = callback;
}

function cleanExpiredStates() {
  const now = Date.now();

  for (const [phone, timestamp] of timestamps) {
    if (now - timestamp > TIMEOUTS.stateExpiry) {
      states.delete(phone);
      timestamps.delete(phone);
      logger.info({ phone: extractPhoneFromJid(phone) }, 'Sesión expirada por inactividad');

      if (onExpireCallback) {
        try {
          onExpireCallback(phone);
        } catch (error) {
          logger.error({ err: error, phone: extractPhoneFromJid(phone) }, 'Error en callback de expiración');
        }
      }
    }
  }
}

export function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(cleanExpiredStates, TIMEOUTS.cleanupInterval);
  logger.debug('Cleanup de sesiones iniciado');
}

export function stopCleanup() {
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
