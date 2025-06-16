import { fetchBoardContent, saveBoardContent, fetchBoards, setState } from './boardState.js';
import { getState, addNote, removeNote, addConnection, removeConnection, updateNotePosition } from './boardState.js';
import { initStyle } from './style.js';

window.addNote = addNote;

// Получить id доски из URL
function getBoardId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

const boardId = getBoardId();

async function setBoardTitle() {
  const header = document.querySelector('.logo') || document.querySelector('.fantasy-board-title');
  if (!header) return;
  try {
    const boards = await fetchBoards();
    const board = boards.find(b => b.id == boardId);
    if (board) header.textContent = board.name;
  } catch {}
}

// Загрузка содержимого доски с сервера
async function loadBoardFromServer(boardId) {
  console.log('loadBoardFromServer: Starting', boardId);
  if (!boardId) {
    console.error('loadBoardFromServer: No board ID provided');
    document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;"><h2 style="color:#a67c52;">Не указан id доски!</h2><a href="index.html" style="color:#a67c52;font-size:1.2em;">На главную</a></div>';
    return;
  }
  
  try {
    console.log('loadBoardFromServer: Fetching content for board', boardId);
    const content = await fetchBoardContent(boardId);
    console.log('loadBoardFromServer: Received content', content);
    
    if (content && typeof content === 'object') {
      console.log('loadBoardFromServer: Content seems valid');
      setState(content);
      console.log('loadBoardFromServer: State set', getState());
      
      // Инициализируем UI доски
      try {
        if (typeof window.initBoardUI === 'function') {
          console.log('loadBoardFromServer: Calling window.initBoardUI');
          window.initBoardUI();
        } else {
          console.log('loadBoardFromServer: window.initBoardUI not found, trying to load scripts.js');
          const scriptsModule = await import('./scripts.js');
          if (typeof window.initBoardUI === 'function') {
            console.log('loadBoardFromServer: scripts.js loaded, calling initBoardUI');
            window.initBoardUI();
          } else {
            throw new Error('initBoardUI not available after loading scripts.js');
          }
        }
      } catch (error) {
        console.error('loadBoardFromServer: Error initializing UI:', error);
        document.body.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
          <h2 style="color:#a67c52;">Ошибка инициализации интерфейса</h2>
          <div style="color:#a67c52;">${error.message}</div>
          <a href="index.html" style="color:#a67c52;font-size:1.2em;">На главную</a>
        </div>`;
        return;
      }
      
      // Устанавливаем заголовок
      document.title = `${content.title || 'Без названия'} - Board`;
      setBoardTitle();
      
    } else {
      throw new Error('Invalid board content format');
    }
  } catch (error) {
    console.error('loadBoardFromServer: Error', error);
    document.body.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
      <h2 style="color:#a67c52;">Ошибка загрузки доски</h2>
      <div style="color:#a67c52;">${error.message}</div>
      <a href="index.html" style="color:#a67c52;font-size:1.2em;">На главную</a>
    </div>`;
  }
}

// Сохранение содержимого доски на сервер
async function saveBoardToServer() {
  console.log('saveBoardToServer: Starting');
  try {
    const content = getState();
    console.log('saveBoardToServer: Saving content', content);
    await saveBoardContent(boardId, content);
    console.log('saveBoardToServer: Save successful');
  } catch (e) {
    console.error('saveBoardToServer: Error saving board', e);
    alert('Ошибка сохранения доски: ' + e.message);
  }
}

// Автоматическое сохранение на сервере при изменениях
function patchStorageForAutosave() {
  const origAddNote = window.addNote;
  const origRemoveNote = window.removeNote;
  const origAddConnection = window.addConnection;
  const origRemoveConnection = window.removeConnection;
  const origUpdateNotePosition = window.updateNotePosition;
  window.addNote = function(...args) { origAddNote.apply(this, args); saveBoardToServer(); };
  window.removeNote = function(...args) { origRemoveNote.apply(this, args); saveBoardToServer(); };
  window.addConnection = function(...args) { origAddConnection.apply(this, args); saveBoardToServer(); };
  window.removeConnection = function(...args) { origRemoveConnection.apply(this, args); saveBoardToServer(); };
  window.updateNotePosition = function(...args) { origUpdateNotePosition.apply(this, args); saveBoardToServer(); };
}

// Автоматическая загрузка при открытии страницы
if (window.location.pathname.endsWith('board.html')) {
  initStyle();
  loadBoardFromServer(boardId);
}

window.saveBoardToServer = saveBoardToServer; 