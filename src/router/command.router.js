import logger from '../utils/logger.js';
import { MENUS, MESSAGES } from '../utils/constants.js';
import { pauseUser } from '../state/paused-users.js';
import { extractPhoneFromJid } from '../utils/helpers.js';

const BACK_TO_MAIN = ['0', 'menu', 'menú', 'inicio', 'hola', 'buenas', 'volver'];

function goToMain(from, stateManager) {
  stateManager.setState(from, {
    currentMenu: 'main',
    previousMenu: null,
    selectedOption: null,
    context: {},
  });
}

function sendMenuResponse(sock, from, menu, messageService) {
  if (menu.location) {
    messageService.sendLocation(sock, from, menu.location.latitude, menu.location.longitude);
  }

  messageService.sendText(sock, from, menu.text);
}

function findMenuByKeyword(text, currentState) {
  const menu = MENUS[currentState.currentMenu];

  if (menu?.keywords?.[text]) {
    return menu.keywords[text];
  }

  for (const [key, menuData] of Object.entries(MENUS)) {
    if (key !== currentState.currentMenu && menuData.keywords?.[text]) {
      return menuData.keywords[text];
    }
  }

  return null;
}

export function routeMessage(parsedMessage, deps) {
  const { stateManager, messageService, sock } = deps;
  const { from, body } = parsedMessage;

  if (!body) return;

  const text = body.toLowerCase().trim();

  if (BACK_TO_MAIN.includes(text)) {
    goToMain(from, stateManager);
    messageService.sendText(sock, from, MESSAGES.backToMain);
    return;
  }

  const currentState = stateManager.getState(from);

  const isFirstInteraction = !stateManager.hasState(from);

  if (isFirstInteraction) {
    stateManager.setState(from, {
      currentMenu: 'main',
      previousMenu: null,
      selectedOption: 'shown',
      context: {},
    });
    messageService.sendText(sock, from, MESSAGES.backToMain);
    return;
  }

  if (/^\d+$/.test(text)) {
    if (currentState.currentMenu === 'main') {
      const option = MENUS.main.options[text];

      if (option && MENUS[option]) {
        stateManager.setState(from, {
          currentMenu: option,
          previousMenu: 'main',
          selectedOption: text,
          context: {},
        });

        logger.info(
          { from: extractPhoneFromJid(from), option: text, menu: option },
          'Menu seleccionado',
        );
        sendMenuResponse(sock, from, MENUS[option], messageService);
        return;
      }
    }

    const parentMenu = MENUS[currentState.currentMenu];
    if (parentMenu?.options?.[text]) {
      const subOption = parentMenu.options[text];
      const subMenu = MENUS[subOption];

      if (subMenu) {
        stateManager.setState(from, {
          currentMenu: subOption,
          previousMenu: currentState.currentMenu,
          selectedOption: text,
          context: {},
        });

        logger.info(
          { from: extractPhoneFromJid(from), option: text, menu: subOption },
          'Submenu seleccionado',
        );
        sendMenuResponse(sock, from, subMenu, messageService);
        return;
      }
    }
  }

  const matchedMenu = findMenuByKeyword(text, currentState);

  if (matchedMenu && MENUS[matchedMenu]) {
    stateManager.setState(from, {
      currentMenu: matchedMenu,
      previousMenu: currentState.currentMenu,
      selectedOption: text,
      context: {},
    });

    logger.info(
      { from: extractPhoneFromJid(from), keyword: text, menu: matchedMenu },
      'Menu seleccionado por keyword',
    );
    sendMenuResponse(sock, from, MENUS[matchedMenu], messageService);
    return;
  }

  if (currentState.currentMenu !== 'main') {
    messageService.sendText(sock, from, MESSAGES.advisorRedirect);
    pauseUser(from, false);
    goToMain(from, stateManager);
    logger.info(
      { from: extractPhoneFromJid(from), menu: currentState.currentMenu },
      'Redirecting to advisor',
    );
  } else {
    messageService.sendText(sock, from, MESSAGES.defaultReply);
  }
}
