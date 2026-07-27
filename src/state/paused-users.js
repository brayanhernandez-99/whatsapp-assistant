import logger from '../utils/logger.js';
import { extractPhoneFromJid } from '../utils/helpers.js';
import env from '../config/env.js';

const pausedUsers = new Map();
const advisorTimers = new Map();
let onAdvisorTimeout = null;

export function setOnAdvisorTimeout(callback) {
  onAdvisorTimeout = callback;
}

export function pauseUser(phone, auto = false) {
  pausedUsers.set(phone, { pausedAt: Date.now(), auto });
  startAdvisorTimer(phone);
  logger.info({ phone: extractPhoneFromJid(phone), auto }, 'Bot pausado para usuario');
}

export function resumeUser(phone) {
  cancelAdvisorTimer(phone);
  if (pausedUsers.has(phone)) {
    pausedUsers.delete(phone);
    logger.info({ phone: extractPhoneFromJid(phone) }, 'Bot reanudado para usuario');
    return true;
  }
  logger.warn({ phone: extractPhoneFromJid(phone) }, 'No se encontro usuario pausado para reanudar');
  return false;
}

export function isPaused(phone) {
  return pausedUsers.has(phone);
}

export function trackAgentActivity(phone) {
  if (pausedUsers.has(phone)) {
    resetAdvisorTimer(phone);
  }
}

function startAdvisorTimer(phone) {
  cancelAdvisorTimer(phone);
  const timeoutMs = env.ADVISOR_TIMEOUT * 60 * 1000;

  const timer = setTimeout(() => {
    advisorTimers.delete(phone);
    if (onAdvisorTimeout) onAdvisorTimeout(phone);
    resumeUser(phone);
    logger.info({ phone }, 'Sesion de asesor expirada - bot reanudado');
  }, timeoutMs);

  advisorTimers.set(phone, timer);
  logger.debug({ phone, timeout: env.ADVISOR_TIMEOUT }, 'Timer de asesor iniciado');
}

function resetAdvisorTimer(phone) {
  cancelAdvisorTimer(phone);
  startAdvisorTimer(phone);
}

function cancelAdvisorTimer(phone) {
  const timer = advisorTimers.get(phone);
  if (timer) {
    clearTimeout(timer);
    advisorTimers.delete(phone);
  }
}

export function cleanupTimers() {
  for (const [, timer] of advisorTimers) {
    clearTimeout(timer);
  }
  advisorTimers.clear();
}
