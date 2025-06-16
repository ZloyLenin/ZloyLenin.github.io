// Модуль для управления состоянием доски: сохранение, загрузка, добавление и удаление заметок и связей

// Imports for API interaction
// import { state, saveState } from './storage.js'; // Удаляем импорт из storage.js

const API_BASE_URL = '/api'; // Базовый URL для API досок

// --- Состояние текущей доски ---
let currentBoardState = { notes: [], connections: [] };

export function setState(newState) {
  console.log('boardState.js: Setting state', newState);
  currentBoardState = newState;
}

export function getState() {
  console.log('boardState.js: Getting state', currentBoardState);
  return currentBoardState;
}

// --- Функции модификации состояния доски ---
// Эти функции изменяют локальное состояние и должны вызываться ПЕРЕД сохранением на сервере

export function addNote(note) {
  console.log('boardState.js: addNote called', note);
  
  // Сохраняем полные данные элемента для не-custom заметок
  if (note.type !== 'custom' && note.itemId) {
    // Находим данные элемента в соответствующем наборе данных
    const dataSets = window.dataSets || {};
    let itemData = null;
    
    // Try to find item data in the correct dataset
    if (note.itemType) {
      // First try with exact type
      const dataSetKey = note.itemType;
      if (dataSets[dataSetKey]) {
        itemData = dataSets[dataSetKey].find(item => item.id === note.itemId);
      }
      // Then try with pluralized type
      if (!itemData && dataSets[dataSetKey + 's']) {
        itemData = dataSets[dataSetKey + 's'].find(item => item.id === note.itemId);
      }
    }
    
    // If still not found, try with note.type
    if (!itemData && note.type) {
      if (dataSets[note.type]) {
        itemData = dataSets[note.type].find(item => item.id === note.itemId);
      }
      // Try pluralized version
      if (!itemData && dataSets[note.type + 's']) {
        itemData = dataSets[note.type + 's'].find(item => item.id === note.itemId);
      }
    }
    
    if (itemData) {
      // Store complete item data
      note.itemSnapshot = JSON.parse(JSON.stringify(itemData));
      // Also store the dataset type for future reference
      note.datasetType = note.type;
    }
  }
  
  // Сохраняем размеры и позицию
  if (note.pos) {
    note.pos = {
      x: parseFloat(note.pos.x) || 0,
      y: parseFloat(note.pos.y) || 0,
      width: parseFloat(note.pos.width) || 250,
      height: parseFloat(note.pos.height) || 140
    };
  } else {
    note.pos = {
      x: 0,
      y: 0,
      width: 250,
      height: 140
    };
  }
  
  currentBoardState.notes.push(note);
  console.log('boardState.js: State after addNote', currentBoardState);
  
  // Автоматически сохраняем на сервер
  if (typeof window.saveBoardToServer === 'function') {
    window.saveBoardToServer();
  }
}

export function removeNote(noteId) {
  console.log('boardState.js: removeNote called', noteId);
  currentBoardState.notes = currentBoardState.notes.filter(note => note.id !== noteId);
  console.log('boardState.js: State after removeNote', currentBoardState);
  // Автоматически сохраняем на сервер
  if (typeof window.saveBoardToServer === 'function') {
    window.saveBoardToServer();
  }
}

export function addConnection(connection) {
  console.log('boardState.js: addConnection called', connection);
  // Проверяем, существует ли уже такая связь
  const exists = currentBoardState.connections.some(
    conn => (conn.from === connection.from && conn.to === connection.to) ||
            (conn.from === connection.to && conn.to === connection.from)
  );
  
  if (!exists) {
    // Добавляем уникальный id для связи
    const connectionId = `${connection.from}-${connection.to}`;
    currentBoardState.connections.push({
      ...connection,
      id: connectionId
    });
    console.log('boardState.js: Connection added', currentBoardState.connections);
    
    // Автоматически сохраняем на сервер
    if (typeof window.saveBoardToServer === 'function') {
      window.saveBoardToServer();
    }
  } else {
    console.log('boardState.js: Connection already exists');
  }
}

export function removeConnection(connectionId) {
  console.log('boardState.js: removeConnection called', connectionId);
  const [fromId, toId] = connectionId.split('-');
  currentBoardState.connections = currentBoardState.connections.filter(conn => 
    !(conn.from === fromId && conn.to === toId) && 
    !(conn.from === toId && conn.to === fromId)
  );
  console.log('boardState.js: State after removeConnection', currentBoardState);
  
  // Автоматически сохраняем на сервер
  if (typeof window.saveBoardToServer === 'function') {
    window.saveBoardToServer();
  }
}

export function updateNotePosition(noteId, newPos) {
  console.log('boardState.js: updateNotePosition called', noteId, newPos);
  const note = currentBoardState.notes.find(n => n.id === noteId);
  if (note) {
    // Ensure all position properties are numbers and preserve existing values if not provided
    note.pos = {
      x: parseFloat(newPos.x) || note.pos?.x || 0,
      y: parseFloat(newPos.y) || note.pos?.y || 0,
      width: parseFloat(newPos.width) || note.pos?.width || 250,
      height: parseFloat(newPos.height) || note.pos?.height || 140
    };
    console.log('boardState.js: Note position updated', note);
    console.log('boardState.js: State after updateNotePosition', currentBoardState);
    // Автоматически сохраняем на сервер
    if (typeof window.saveBoardToServer === 'function') {
      window.saveBoardToServer();
    }
  } else {
    console.warn('boardState.js: Note not found for position update', noteId);
  }
}

// Функция для восстановления заметки из сохраненного состояния
export function restoreNoteFromState(note) {
  console.log('Restoring note from state:', note);
  
  const restoredNote = {
    id: note.id,
    type: note.type,
    pos: {
      x: parseFloat(note.pos?.x) || 0,
      y: parseFloat(note.pos?.y) || 0,
      width: parseFloat(note.pos?.width) || 250,
      height: parseFloat(note.pos?.height) || 140
    }
  };
  
  if (note.type === 'custom') {
    return {
      ...restoredNote,
      title: note.custom?.title || '',
      body: note.custom?.body || '',
      custom: note.custom
    };
  } else {
    // Для не-custom заметок используем сохраненный снапшот
    if (note.itemSnapshot) {
      return {
        ...restoredNote,
        ...note.itemSnapshot,
        id: note.itemId,
        datasetType: note.datasetType
      };
    }
    
    // Если снапшота нет, пытаемся найти данные в текущих наборах данных
    const dataSets = window.dataSets || {};
    let itemData = null;
    
    if (note.itemType && dataSets[note.itemType]) {
      itemData = dataSets[note.itemType].find(item => item.id === note.itemId);
    }
    if (!itemData && note.itemType && dataSets[note.itemType + 's']) {
      itemData = dataSets[note.itemType + 's'].find(item => item.id === note.itemId);
    }
    if (!itemData && note.type && dataSets[note.type]) {
      itemData = dataSets[note.type].find(item => item.id === note.itemId);
    }
    if (!itemData && note.type && dataSets[note.type + 's']) {
      itemData = dataSets[note.type + 's'].find(item => item.id === note.itemId);
    }
    
    if (itemData) {
      return {
        ...restoredNote,
        ...itemData,
        datasetType: note.datasetType
      };
    }
    
    // Если данные не найдены, возвращаем базовую структуру
    return {
      ...restoredNote,
      name: 'Неизвестный элемент',
      datasetType: note.datasetType
    };
  }
}

// --- Функции взаимодействия с API сервера ---

// Получение списка досок
export async function fetchBoards() {
  console.log('boardState.js: fetchBoards called');
  try {
    const response = await fetch(`${API_BASE_URL}/boards`);
     console.log('boardState.js: fetchBoards response status', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка HTTP: ${response.status} - ${errorText}`);
    }
    const boards = await response.json();
     console.log('boardState.js: fetchBoards received', boards);
    return boards;
  } catch (error) {
    console.error('boardState.js: Ошибка при получении списка досок:', error);
    throw error;
  }
}

// Получение содержимого конкретной доски
export async function fetchBoardContent(boardId) {
  console.log('boardState.js: fetchBoardContent called for boardId', boardId);
  if (!boardId) {
    throw new Error('ID доски не указан');
  }
  try {
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}`);
     console.log('boardState.js: fetchBoardContent response status', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка HTTP: ${response.status} - ${errorText}`);
    }
    const content = await response.json();
     console.log('boardState.js: fetchBoardContent received', content);
    // Валидация полученных данных (опционально, но рекомендуется)
    // Проверяем, содержит ли ответ свойство 'content' и является ли оно объектом
    if (typeof content !== 'object' || content === null || !content.content) {
        console.warn('boardState.js: fetchBoardContent received unexpected top-level format', content);
        return { notes: [], connections: [] }; // Возвращаем пустой формат, если нет свойства content
    }

    const boardContent = content.content; // Извлекаем содержимое доски из свойства 'content'

    // Валидация содержимого доски
    if (typeof boardContent !== 'object' || !Array.isArray(boardContent.notes) || !Array.isArray(boardContent.connections)) {
       console.warn('boardState.js: fetchBoardContent received unexpected content format', boardContent);
      // Можно выбросить ошибку или вернуть пустой объект, в зависимости от ожидаемого поведения
      return { notes: [], connections: [] };
    }
    return boardContent; // Возвращаем извлеченное содержимое доски
  } catch (error) {
    console.error(`boardState.js: Ошибка при получении содержимого доски ${boardId}:`, error);
    throw error;
  }
}

// Сохранение содержимого доски
export async function saveBoardContent(boardId, content) {
  console.log('boardState.js: saveBoardContent called for boardId', boardId, 'with content', content);
  if (!boardId) {
    throw new Error('ID доски не указан');
  }
  try {
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: JSON.stringify(content) }),
    });
     console.log('boardState.js: saveBoardContent response status', response.status);

    if (!response.ok) {
       const errorText = await response.text();
       console.error('boardState.js: saveBoardContent failed with text:', errorText);
      throw new Error(`Ошибка HTTP при сохранении: ${response.status} - ${errorText}`);
    }
    const result = await response.json(); // Сервер может вернуть подтверждение
     console.log('boardState.js: saveBoardContent successful', result);
    return result;
  } catch (error) {
    console.error(`boardState.js: Ошибка при сохранении содержимого доски ${boardId}:`, error);
    throw error;
  }
}

// Создание новой доски
export async function createBoard(name) {
  console.log('boardState.js: createBoard called with name', name);
  try {
    const response = await fetch(`${API_BASE_URL}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
     console.log('boardState.js: createBoard response status', response.status);

    if (!response.ok) {
       const errorText = await response.text();
       console.error('boardState.js: createBoard failed with text:', errorText);
      throw new Error(`Ошибка HTTP при создании доски: ${response.status} - ${errorText}`);
    }
    const newBoard = await response.json();
     console.log('boardState.js: createBoard successful', newBoard);
    return newBoard;
  } catch (error) {
    console.error('boardState.js: Ошибка при создании доски:', error);
    throw error;
  }
}

// Удаление доски
export async function deleteBoard(boardId) {
  console.log('boardState.js: deleteBoard called for boardId', boardId);
  if (!boardId) {
    throw new Error('ID доски не указан');
  }
  try {
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
      method: 'DELETE',
    });
     console.log('boardState.js: deleteBoard response status', response.status);

    if (!response.ok) {
       const errorText = await response.text();
       console.error('boardState.js: deleteBoard failed with text:', errorText);
      throw new Error(`Ошибка HTTP при удалении доски: ${response.status} - ${errorText}`);
    }
    const result = await response.json(); // Сервер может вернуть подтверждение
     console.log('boardState.js: deleteBoard successful', result);
    return result;
  } catch (error) {
    console.error(`boardState.js: Ошибка при удалении доски ${boardId}:`, error);
    throw error;
  }
}

// Экспортируем функции модификации состояния для использования в UI
// Удаляем функции, которые уже экспортированы индивидуально
