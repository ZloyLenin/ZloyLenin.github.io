/**
* Модуль для управления хранением состояния в файловой системе
 */

// --- Функции и состояние для локального хранения (например, настроек пользователя) ---
// Оставляем только функции, которые действительно управляют локальным состоянием,
// например, для темы или других настроек пользователя.

/**
 * Загружает состояние из файла
 * @returns {Promise<Object|null>} загруженное состояние
 */
async function loadState() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Токен авторизации не найден');
      return null;
    }

    const response = await fetch('/load-state', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Требуется авторизация');
        return null;
      }
      console.warn('Файл состояния не найден, создаем новый');
      return null;
    }
    const savedState = await response.json();
    if (!savedState.notes || !savedState.connections) {
      throw new Error('Некорректный формат данных');
    }
    return savedState;
  } catch (e) {
    console.error('Ошибка загрузки состояния:', e);
    return null;
  }
}

/**
 * Сохраняет текущее состояние
 * @returns {Promise<void>}
 */
async function saveState() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Требуется авторизация');
    }

    const response = await fetch('/save-state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(currentState)
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Требуется авторизация');
      }
      throw new Error('Ошибка сохранения состояния');
    }
  } catch (e) {
    console.error('Ошибка сохранения состояния:', e);
    // Показываем пользователю уведомление об ошибке
    const event = new CustomEvent('save-error', { 
      detail: { message: e.message === 'Требуется авторизация' ? 
        'Для сохранения изменений необходимо авторизоваться' : 
        'Не удалось сохранить изменения. Запустите локальный сервер для сохранения.' 
      } 
    });
    window.dispatchEvent(event);
  }
}

/**
 * Добавляет заметку в состояние
 * @param {Object} note - заметка для добавления
 */
function addNote(note) {
  currentState.notes.push(note);
  saveState();
}

/**
 * Удаляет заметку из состояния
 * @param {string} noteId - id заметки
 */
function removeNote(noteId) {
  currentState.notes = currentState.notes.filter(n => n.id !== noteId);
  currentState.connections = currentState.connections.filter(
    c => c.from !== noteId && c.to !== noteId
  );
  saveState();
}

/**
 * Добавляет связь между заметками
 * @param {string} fromId - id начальной заметки
 * @param {string} toId - id конечной заметки
 */
function addConnection(fromId, toId) {
  const exists = currentState.connections.some(
    c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
  );
  if (!exists) {
    currentState.connections.push({ from: fromId, to: toId });
    saveState();
  }
}

/**
 * Удаляет связь между заметками
 * @param {string} fromId - id начальной заметки
 * @param {string} toId - id конечной заметки
 */
function removeConnection(fromId, toId) {
  currentState.connections = currentState.connections.filter(
    c => !(c.from === fromId && c.to === toId)
  );
  saveState();
}

/**
 * Обновляет позицию заметки
 * @param {string} noteId - id заметки
 * @param {Object} pos - новая позиция
 */
function updateNotePosition(noteId, pos) {
  const note = currentState.notes.find(n => n.id === noteId);
  if (note) {
    note.pos = pos;
    saveState();
  }
}

export { loadState }; 