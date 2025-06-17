import { normalizeMonsters, normalizeSpells, normalizeArtifacts, normalizeItems } from './dataNormalization.js';
import { showSpellDetails, showItemDetails, addToBoard, bindUI, showSuggestions, setBoardScale, setPan } from './uiHandlers.js';
import { getState as getBoardState, addNote, removeNote, addConnection, removeConnection, updateNotePosition } from './boardState.js';
import { linkMode, handleDragStart, handleDragOver, handleDrop, makeDraggable, makeResizable, setLinkMode } from './dragDrop.js';
import { redrawLinks, initLinksSystem, getLinkMode } from './links.js';
import { showDiceRoller } from './diceRoller.js';
import { checkAuth, loadUserProfile, toggleMenu, logout } from './auth.js';
import { initTheme } from './theme.js';
import { initSearch, performSearch } from './search.js';

// Инициализация UI доски
function initBoardUI() {
  console.log('window.initBoardUI called (scripts.js)');
  
  // Выбираем все необходимые элементы
  const elements = {
    searchViewBtn: document.getElementById('searchViewBtn'),
    boardSec: document.getElementById('board-container'),
    searchBtn: document.getElementById('searchBtn'),
    searchInput: document.getElementById('searchInput'),
    board: document.getElementById('board'),
    linksLayer: document.getElementById('linksLayer'),
    modal: document.getElementById('modal'),
    modalHeader: document.getElementById('modalHeader'),
    modalContent: document.getElementById('modalContent'),
    modalClose: document.getElementById('modalCloseBtn'),
    addNoteBtn: document.getElementById('addNoteBtn'),
    linkModeBtn: document.getElementById('linkModeBtn'),
    clearBoardBtn: document.getElementById('clearBoardBtn'),
    diceRollBtn: document.getElementById('diceRollBtn'),
    linkPopover: document.getElementById('linkPopover'),
    unlinkBtn: document.getElementById('unlinkBtn'),
    floatingSearchBtn: document.getElementById('floatingSearchBtn'),
    mainMenuBtn: document.getElementById('mainMenuBtn'),
    searchSidebar: document.getElementById('searchSidebar'),
    searchSection: document.getElementById('searchSection'),
    searchCloseBtn: document.getElementById('searchCloseBtn')
  };
  console.log('initBoardUI (scripts.js): Elements selected', elements);

  // Подготавливаем наборы данных
  const dataSets = {
    spells: window.allSpells ? normalizeSpells(window.allSpells) : [],
    allArt: window.allArt ? normalizeArtifacts(window.allArt) : [],
    allItems: window.allItems ? normalizeItems(window.allItems, window.oTypes) : [],
    monsters: window.allMonsters ? normalizeMonsters(window.allMonsters, window.monsterSize, window.aBioms, window.monsterSources) : []
  };
  console.log('initBoardUI (scripts.js): DataSets prepared', dataSets);

  // Вызываем bindUI с необходимыми параметрами
  console.log('initBoardUI (scripts.js): Calling bindUI with elements', elements);
  bindUI(elements, dataSets, addToBoard, window.saveBoardToServer, getBoardState, redrawLinks, makeDraggable, makeResizable, setLinkMode);
  
  // Инициализируем систему связей
  initLinksSystem();

  // Поиск
  if (elements.searchBtn) {
    elements.searchBtn.addEventListener('click', () => {
      elements.searchSidebar.classList.add('active');
      elements.searchInput.focus();
    });
  }

  if (elements.searchCloseBtn && elements.searchSection) {
    elements.searchCloseBtn.addEventListener('click', () => {
      elements.searchSection.classList.remove('active');
    });
  }
}

// Экспортируем функцию в глобальное пространство имен
window.initBoardUI = initBoardUI;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired');
  
  // Инициализируем тему
  if (typeof initTheme === 'function') {
    initTheme();
    console.log('Theme initialized');
  }
  
  // Проверяем авторизацию
  if (typeof checkAuth === 'function') {
    checkAuth();
    console.log('Auth check passed');
  }
  
  // Загружаем профиль пользователя
  if (typeof loadUserProfile === 'function') {
    loadUserProfile().then(profile => {
      console.log('User profile loaded', profile);
      
      // На странице board.html инициализация UI происходит после загрузки состояния доски
      if (window.location.pathname.includes('board.html')) {
        console.log('On board.html, UI init deferred to window.initBoardUI');
      } else {
        initBoardUI();
        console.log('UI initialized on non-board page');
      }
    });
  }
});

// Глобальные экспорты для совместимости
window.toggleMenu = toggleMenu;
window.logout = logout;
window.setBoardScale = setBoardScale;
window.setPan = setPan;
window.getBoardState = getBoardState;
window.addNote = addNote;
window.removeNote = removeNote;
window.addConnection = addConnection;
window.removeConnection = removeConnection;
window.updateNotePosition = updateNotePosition;
window.oTypes = window.oTypes || {};
window.oSources = window.oSources || {};

window.addEventListener('save-error', (e) => {
  alert(e.detail.message);
});

window.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded fired');
  try {
    initTheme();
    console.log('Theme initialized');
    if (!checkAuth()) {
      console.log('Auth check failed, returning');
      return;
    }
    console.log('Auth check passed');
    const user = await loadUserProfile();
    if (!user) {
      console.log('User profile not loaded, returning');
      return;
    }
    console.log('User profile loaded', user);
    if (window.location.pathname.endsWith('board.html')) {
      console.log('On board.html, UI init deferred to window.initBoardUI');
      return;
    }
    console.log('Not on board.html, initializing UI directly');
    const elements = {
      searchViewBtn: document.querySelector('#searchViewBtn'),
      boardSec: document.querySelector('#board-container'),
      searchBtn: document.querySelector('#searchBtn'),
      searchInput: document.querySelector('#searchInput'),
      board: document.querySelector('#board'),
      linksLayer: document.querySelector('#linksLayer'),
      modal: document.querySelector('#modal'),
      modalHeader: document.querySelector('#modalHeader'),
      modalContent: document.querySelector('#modalContent'),
      modalClose: document.querySelector('#modalCloseBtn'),
      addNoteBtn: document.querySelector('#addNoteBtn'),
      linkModeBtn: document.querySelector('#linkModeBtn'),
      clearBoardBtn: document.querySelector('#clearBoardBtn'),
      diceRollBtn: document.querySelector('#diceRollBtn'),
      linkPopover: document.querySelector('#linkPopover'),
      unlinkBtn: document.querySelector('#unlinkBtn'),
      floatingSearchBtn: document.getElementById('floatingSearchBtn'),
      mainMenuBtn: document.querySelector('#mainMenuBtn'),
      searchSidebar: document.getElementById('searchSidebar'),
      searchSection: document.getElementById('searchSection'),
      searchCloseBtn: document.getElementById('searchCloseBtn')
    };
    const dataSets = {
      spells: window.allSpells ? normalizeSpells(window.allSpells) : [],
      allArt: window.allArt ? normalizeArtifacts(window.allArt) : [],
      allItems: window.allItems ? normalizeItems(window.allItems, window.oTypes) : [],
      monsters: window.allMonsters ? normalizeMonsters(window.allMonsters, window.monsterSize, window.aBioms, window.monsterSources) : []
    };
    const redrawLinksWithLayer = () => {
      if (elements.linksLayer) {
        redrawLinks(elements.linksLayer);
      }
    };
    bindUI(elements, dataSets, addToBoard, window.saveBoardToServer, getBoardState, redrawLinksWithLayer);
    if (elements.diceRollBtn) {
      elements.diceRollBtn.addEventListener('click', () => {
        showDiceRoller(elements.modal, elements.modalHeader, elements.modalContent);
      });
    }
    if (window.loadState) {
      const savedState = await window.loadState();
      if (savedState && savedState.notes) {
        savedState.notes.forEach(note => {
          const item = {
            id: note.itemId,
            ...note.custom
          };
          addToBoard(item, note.type, note.id, note.pos, true, elements.board, window.saveState || (() => {}), redrawLinksWithLayer, addNote);
        });
      }
    }
    initLinksSystem();
    if (elements.floatingSearchBtn) {
      elements.floatingSearchBtn.addEventListener('click', () => {
        if (typeof window.setPan === 'function') window.setPan(0, 0);
        if (typeof window.setBoardScale === 'function') window.setBoardScale(1);
      });
    }
    if (elements.mainMenuBtn) {
      elements.mainMenuBtn.addEventListener('click', () => {
        window.location.href = '/';
      });
    }
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error);
  }
});

window.initMainPageUI = async function() { console.log('initMainPageUI placeholder'); };
window.initAccountPageUI = async function() { console.log('initAccountPageUI placeholder'); };

window.performSearch = performSearch;