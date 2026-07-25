import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import logger from '../utils/logger.js';
import env from '../config/env.js';

export async function loadSession() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(env.SESSION_DIR);
    logger.info('Sesión cargada correctamente');
    return { state, saveCreds };
  } catch (error) {
    logger.error({ err: error }, 'Error al cargar la sesión');
    throw error;
  }
}
