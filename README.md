# WhatsApp Assistant

**WhatsApp Assistant** es un chatbot modular desarrollado con **Node.js** y **Baileys** que automatiza respuestas en WhatsApp mediante menus interactivos con navegacion por opciones numericas y keywords.

---

## Caracteristicas

- Menus interactivos con navegacion por numeros (1-6).
- Routing por keywords en espanol (sin tilde y con tilde).
- Submenus para productos iPhone (17, 16, 15, 13).
- Modo asesor: redirige a un agente humano cuando el usuario escribe texto libre en un submenu.
- Deteccion automatica de cuando el asesor humano escribe (pausa el bot).
- Timeout configurable para reanudar el bot si el asesor no responde.
- Cola de mensajes con rate limiting (1.5-3s entre mensajes).
- Persistencia de sesion de WhatsApp (reconexion automatica con backoff exponencial).
- Limpieza automatica de sesiones por inactividad.
- Envio de ubicacion (Google Maps).
- Logs estructurados con Pino.

---

## Tecnologias

- **Runtime:** Node.js >= 20
- **WhatsApp API:** @whiskeysockets/baileys
- **Logger:** Pino + pino-pretty (dev)
- **QR:** qrcode-terminal
- **Variables de entorno:** dotenv
- **Linter:** ESLint (flat config)
- **Formatter:** Prettier

---

## Estructura del proyecto

```text
whatsapp-assistant/
├── src/
│   ├── app.js                    # Punto de entrada, wiring de dependencias
│   ├── config/
│   │   └── env.js                # Carga de variables de entorno
│   ├── handlers/
│   │   ├── connection.handler.js # Ciclo de vida de conexion y reconexion
│   │   └── message.handler.js    # Procesamiento de mensajes entrantes
│   ├── router/
│   │   └── command.router.js     # Routing de comandos y navegacion de menus
│   ├── services/
│   │   ├── lid-resolver.js       # Resolucion LID a telefono (senderPn, mapa, phoneNumberShare)
│   │   ├── message.service.js    # Cola de envio de mensajes (text, location)
│   │   ├── session.service.js    # Carga de credenciales WhatsApp
│   │   └── whatsapp.service.js   # Creacion de conexion, QR, limpieza
│   ├── state/
│   │   ├── state.manager.js      # Estado por usuario (menu actual, historial)
│   │   └── paused-users.js       # Modo asesor (pausa/reanudacion del bot)
│   ├── utils/
│   │   ├── constants.js          # Definicion de menus, keywords, mensajes
│   │   ├── helpers.js            # Utilidades (extractPhone, isGroup, etc.)
│   │   └── logger.js             # Instancia de Pino
│   └── auth/
│       └── session/              # Credenciales WhatsApp (runtime)
├── .env
├── .env.example
├── .gitignore
├── eslint.config.js
├── package.json
└── README.md
```

---

## Instalacion

```bash
git clone https://github.com/tu-usuario/whatsapp-assistant.git
cd whatsapp-assistant
npm install
```

---

## Variables de entorno

Copia `.env.example` a `.env` y configura:

| Variable | Descripcion | Default |
|---|---|---|
| `NODE_ENV` | Entorno de ejecucion | `development` |
| `BOT_NAME` | Nombre del bot | `WhatsApp Assistant` |
| `LOG_LEVEL` | Nivel de logs (trace/debug/info/warn/error/fatal) | `info` |
| `SESSION_TIMEOUT` | Minutos de inactividad para expirar sesion | `30` |
| `ADVISOR_TIMEOUT` | Minutos para reanudar bot si asesor no responde | `30` |

---

## Ejecutar

```bash
npm start       # Produccion
npm run dev     # Desarrollo (hot reload con --watch)
```

La primera vez aparecera un codigo QR para escanear desde WhatsApp.

---

## Scripts disponibles

| Script | Descripcion |
|---|---|
| `npm start` | Ejecutar en produccion |
| `npm run dev` | Ejecutar en modo desarrollo |
| `npm run lint` | Verificar codigo con ESLint |
| `npm run lint:fix` | Corregir problemas de lint automaticamente |
| `npm run format` | Formatear codigo con Prettier |
| `npm run format:check` | Verificar formato sin modificar |

---

## Flujo del mensaje

```
WhatsApp -> message.handler.js -> lid-resolver.js -> command.router.js -> MENUS (constants.js)
                                     |                                        |
                              phone@s.whatsapp.net                     message.service.js
                                     |                                        |
                                  WhatsApp                              WhatsApp (respuesta)
```

1. `message.handler.js` filtra grupos, detecta mensajes del bot, resuelve LID a telefono, y maneja pausa/resume.
2. `lid-resolver.js` resuelve `id@lid` (WhatsApp Web) a `phone@s.whatsapp.net` via `senderPn` y mapa acumulativo.
3. `command.router.js` busca match por numero, keyword o redirection a asesor.
4. `message.service.js` encola y envia con rate limiting.

---

## Limitaciones conocidas

- **Botones interactivos y listas ELIMINADOS por WhatsApp** — solo texto plano funciona
- **LID (Linked Device ID)**: cuando el usuario escribe desde WhatsApp Web, el `remoteJid` viene como `id@lid` en vez de `phone@s.whatsapp.net`. El `lid-resolver.js` resuelve esto via `senderPn` y un mapa acumulativo
- `makeInMemoryStore` NO existe en Baileys v6.7.23
- `jidDecode` retorna `undefined` si el JID no tiene `@servidor`

---

## Roadmap

### Completado

- [x] Menu principal con opciones numericas.
- [x] Submenus para iPhone.
- [x] Routing por keywords (espanol).
- [x] Compartir ubicacion.
- [x] Modo asesor (redireccion a humano).
- [x] Deteccion automatica de actividad del asesor.
- [x] Timeout de sesion y de asesor.
- [x] Cola de mensajes con rate limiting.
- [x] Reconexion automatica con backoff exponencial.
- [x] Resolucion LID a telefono (WhatsApp Web/dispositivos vinculados).

### Pendiente

- [ ] Envio de imagenes.
- [ ] Envio de documentos PDF.
- [ ] Envio de audios.
- [ ] Integracion con bases de datos.
- [ ] Sistema de usuarios.
- [ ] Integracion con OpenAI / Gemini.
- [ ] Docker.
- [ ] Panel administrativo.
- [ ] API REST.

---

## Licencia

MIT

## Autor

Desarrollado por **Brayan**.
