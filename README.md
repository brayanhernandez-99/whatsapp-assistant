# 🤖 WhatsApp Assistant

**WhatsApp Assistant** es un chatbot modular desarrollado con **Node.js** y **Baileys** que permite automatizar respuestas en WhatsApp mediante menús interactivos y comandos personalizados.

El proyecto está diseñado con una arquitectura escalable para facilitar la incorporación de nuevas funcionalidades, como integración con bases de datos, APIs externas o inteligencia artificial.

---

## 🚀 Características

- ✅ Respuestas automáticas.
- ✅ Menús interactivos.
- ✅ Arquitectura modular y escalable.
- ✅ Persistencia de sesión de WhatsApp.
- ✅ Fácil de mantener y extender.
- ✅ Preparado para integrar bases de datos.
- ✅ Preparado para integrar IA (OpenAI, Gemini, etc.).
- ✅ Organización por responsabilidades.

---

## 🛠️ Tecnologías

- Node.js
- Baileys
- Pino
- JavaScript (ES6+)

---

## 📁 Estructura del proyecto

```text
whatsapp-assistant
│
├── src
│   ├── app.js
│   │
│   ├── config
│   │   ├── baileys.js
│   │   └── env.js
│   │
│   ├── handlers
│   │   ├── connection.handler.js
│   │   └── message.handler.js
│   │
│   ├── commands
│   │   ├── advisor.js
│   │   ├── help.js
│   │   ├── menu.js
│   │   ├── prices.js
│   │   └── products.js
│   │
│   ├── services
│   │   ├── message.service.js
│   │   └── whatsapp.service.js
│   │
│   ├── utils
│   │   ├── constants.js
│   │   └── logger.js
│   │
│   └── auth
│       └── session
│
├── .env
├── .env.example
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

---

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/whatsapp-assistant.git
```

### 2. Ingresar al proyecto

```bash
cd whatsapp-assistant
```

### 3. Instalar las dependencias

```bash
npm install
```

---

## ▶️ Ejecutar el proyecto

Modo normal:

```bash
npm start
```

Modo desarrollo:

```bash
npm run dev
```

La primera vez que ejecutes el proyecto aparecerá un código QR que deberás escanear desde WhatsApp para vincular tu cuenta.

---

## 📌 Funcionalidades actuales

- Respuesta automática a mensajes.
- Menú principal.
- Navegación mediante opciones numéricas.
- Persistencia de sesión.

---

## 🗺️ Roadmap

- [ ] Menú interactivo.
- [ ] Submenús.
- [ ] Envío de imágenes.
- [ ] Envío de documentos PDF.
- [ ] Envío de audios.
- [ ] Compartir ubicación.
- [ ] Integración con bases de datos.
- [ ] Sistema de usuarios.
- [ ] Integración con OpenAI.
- [ ] Integración con Gemini.
- [ ] Docker.
- [ ] Panel administrativo.
- [ ] API REST.

---

## 📚 Objetivo del proyecto

Este proyecto busca servir como una base sólida para desarrollar asistentes automatizados en WhatsApp, permitiendo crear soluciones tanto para uso personal como empresarial.

Su arquitectura modular facilita el crecimiento del proyecto y la incorporación de nuevas funcionalidades sin afectar el código existente.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas.

Si deseas colaborar, puedes crear un **Fork** del repositorio, desarrollar tu mejora y enviar un **Pull Request**.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**.

Puedes usarlo, modificarlo y distribuirlo libremente respetando los términos de la licencia.

---

## 👨‍💻 Autor

Desarrollado por **Brayan**.