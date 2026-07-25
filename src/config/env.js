import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '..', '.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  BOT_NAME: process.env.BOT_NAME || 'WhatsApp Assistant',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  TZ: process.env.TZ || 'America/Bogota',
  SESSION_DIR: join(__dirname, '..', 'auth', 'session'),
};

export default env;
