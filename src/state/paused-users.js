import logger from '../utils/logger.js';

const pausedUsers = new Map();
const agentActivity = new Map();
let autoResumeTimer = null;

const AUTO_RESUME_MINUTES = 10;

function extractPhone(jid) {
  if (!jid) return jid;
  return jid.split('@')[0];
}

export function pauseUser(phone, auto = false) {
  const cleanPhone = extractPhone(phone);
  pausedUsers.set(cleanPhone, { pausedAt: Date.now(), auto });
  logger.info({ phone: cleanPhone, auto }, 'Bot pausado para usuario');
}

export function resumeUser(phone) {
  const cleanPhone = extractPhone(phone);
  if (pausedUsers.has(cleanPhone)) {
    pausedUsers.delete(cleanPhone);
    agentActivity.delete(cleanPhone);
    logger.info({ phone: cleanPhone }, 'Bot reanudado para usuario');
    return true;
  }
  logger.warn({ phone: cleanPhone }, 'No se encontró usuario pausado para reanudar');
  return false;
}

export function isPaused(phone) {
  const cleanPhone = extractPhone(phone);
  return pausedUsers.has(cleanPhone);
}

export function trackAgentActivity(phone) {
  const cleanPhone = extractPhone(phone);
  agentActivity.set(cleanPhone, Date.now());
}

export function startAutoResume() {
  if (autoResumeTimer) return;

  autoResumeTimer = setInterval(() => {
    const now = Date.now();

    for (const [phone, data] of pausedUsers) {
      if (!data.auto) continue;

      const lastActivity = agentActivity.get(phone) || data.pausedAt;
      const minutesSinceActivity = (now - lastActivity) / (60 * 1000);

      if (minutesSinceActivity >= AUTO_RESUME_MINUTES) {
        resumeUser(phone);
        logger.info({ phone }, 'Bot reanudado automáticamente por inactividad');
      }
    }
  }, 60 * 1000);

  logger.debug('Auto-resume de pausas iniciado');
}

export function stopAutoResume() {
  if (autoResumeTimer) {
    clearInterval(autoResumeTimer);
    autoResumeTimer = null;
  }
}

export default {
  pauseUser,
  resumeUser,
  isPaused,
  trackAgentActivity,
  startAutoResume,
  stopAutoResume,
};
