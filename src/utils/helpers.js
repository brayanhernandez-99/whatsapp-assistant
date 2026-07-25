export function extractPhoneFromJid(jid) {
  if (!jid) return null;
  return jid.split('@')[0];
}

export function isGroupJid(jid) {
  if (!jid) return false;
  return jid.endsWith('@g.us');
}

export function extractMessageBody(message) {
  if (!message) return null;

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    null
  );
}

export function extractMessageType(message) {
  if (!message) return 'unknown';

  if (message.conversation || message.extendedTextMessage) return 'text';
  if (message.imageMessage) return 'image';
  if (message.videoMessage) return 'video';
  if (message.audioMessage) return 'audio';
  if (message.documentMessage) return 'document';
  if (message.locationMessage) return 'location';

  return 'unknown';
}
