# AGENTS.md

## Instrucciones para el agente

### REGLA OBLIGATORIA: Plan antes de ejecutar

**NUNCA ejecutes cambios sin aprobacion explicita del usuario.** Antes de modificar cualquier archivo, DEBES:

1. **Crear un plan escrito** que describa:
   - Que archivos se van a crear, modificar o eliminar
   - Que cambios especificos se haran en cada archivo (antes/despues si es posible)
   - Por que se hace cada cambio
   - Que archivos relacionados podrian afectarse
2. **Esperar aprobacion del usuario** — el usuario debe confirmar con algo como "aprobar", "dale", "si", o similar
3. **Solo despues de la aprobacion** ejecutar los cambios

Si el usuario rechaza o pide ajustes, modifica el plan y vuelve a pedir aprobacion. **NUNCA asumas aprobacion implicita.**

---

**ACTUALIZA ESTE ARCHIVO Y EL README.md** cada vez que:
- Se anada, modifique o elimine una funcionalidad
- Se cambie la estructura del proyecto (archivos, carpetas)
- Se agregue o cambie una dependencia
- Se modifique el flujo de mensajes o routing
- Se descubra un bug, workaround o limitacion importante
- Se cambien variables de entorno
- Se modifiquen menus, keywords o mensajes en constants.js
- Se agregue un servicio, handler o modulo nuevo

---

## Arquitectura

Chatbot WhatsApp para **Urban Tech** (tienda de celulares en Medellín). Node.js + Baileys v6.

### Flujo de mensajes

```
WhatsApp → message.handler.js → command.router.js → MENUS (constants.js)
                                                         |
                                                   message.service.js
                                                         |
                                                   WhatsApp (respuesta)
```

1. `message.handler.js`: filtra grupos, detecta `fromMe` (agente), maneja pausa/resume, resuelve LID a telefono
2. `command.router.js`: match por numero, keyword global, o redirection a asesor
3. `message.service.js`: cola de envio con rate limiting (1.5-3s)
4. `constants.js`: definicion de todos los menus, keywords y mensajes

### Archivos clave

| Archivo | Responsabilidad |
|---------|----------------|
| `src/app.js` | Entry point, wiring de dependencias, callbacks de timeout |
| `src/handlers/message.handler.js` | Procesamiento de mensajes, `botSentMessages` tracking, resolucion LID |
| `src/handlers/connection.handler.js` | Conexion/reconexion con backoff exponencial |
| `src/router/command.router.js` | Routing de comandos, `BACK_TO_MAIN`, `findMenuByKeyword`, fallback a asesor |
| `src/services/lid-resolver.js` | Resolucion LID→telefono via `senderPn`, `lidToPhoneMap`, `chats.phoneNumberShare` |
| `src/services/message.service.js` | Cola de envio, `markBotSentMessage` |
| `src/services/whatsapp.service.js` | Creacion de conexion, QR, limpieza de sesion |
| `src/services/session.service.js` | Carga de credenciales WhatsApp |
| `src/state/paused-users.js` | Pausa/reanudacion del bot, timer de asesor |
| `src/state/state.manager.js` | Estado por usuario (menu actual), limpieza por inactividad |
| `src/utils/constants.js` | Menus, keywords, mensajes |
| `src/utils/helpers.js` | `extractPhoneFromJid`, `isGroupJid`, `extractMessageBody` |
| `src/config/env.js` | Variables de entorno |

---

## Limitaciones conocidas

### WhatsApp / Baileys
- **Botones interactivos y listas ELIMINADOS por WhatsApp** — solo texto plano funciona
- **LID (Linked Device ID)**: cuando el usuario escribe desde WhatsApp Web, el `remoteJid` viene como `id@lid` en vez de `phone@s.whatsapp.net`. El `lid-resolver.js` resuelve esto via `senderPn` y un mapa acumulativo
- `makeInMemoryStore` NO existe en Baileys v6.7.23
- `jidDecode` retorna `undefined` si el JID no tiene `@servidor` — por eso `resolveJid` siempre agrega `@s.whatsapp.net`

### Pausa/Resume
- `pauseUser(phone, auto=true)` = agente escribio (auto-deteccion)
- `pauseUser(phone, auto=false)` = usuario escribio "asesor" o texto no reconocido en submenu
- La key del Map es el telefono limpio (sin `@s.whatsapp.net`)
- `fromMe` messages: `senderPn` es el telefono del BOT, NO del cliente — por eso `resolveJid` usa flag `fromMe` para evitar resolver con el telefono equivocado

### Router
- `BACK_TO_MAIN = ['0', 'menu', 'menú', 'inicio', 'hola', 'buenas', 'volver']`
- Keywords son GLOBALES (matchean desde cualquier submenu)
- Fallback en submenu: texto no reconocido → redirect a asesor + pausa bot

---

## Convenciones

- **Logs en espanol SIN tildes** (accent-free)
- `extractPhoneFromJid(jid)` retorna solo el numero (sin `@s.whatsapp.net`)
- `resolveJid(jid, messageKey, fromMe)` retorna JID completo CON `@s.whatsapp.net`
- Los menus se definen en `constants.js` como objetos con `text`, `options` (numerico), `keywords` (texto libre)
- `botSentMessages` Set limitado a 500 entradas (FIFO)
- Rate limiting: 1.5-3s aleatorio entre mensajes enviados

---

## Variables de entorno

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `NODE_ENV` | Entorno | `development` |
| `BOT_NAME` | Nombre del bot | `WhatsApp Assistant` |
| `LOG_LEVEL` | Nivel de logs | `info` |
| `SESSION_TIMEOUT` | Minutos para expirar sesion | `30` |
| `ADVISOR_TIMEOUT` | Minutos para reanudar bot | `30` |
