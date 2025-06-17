import { handleDragStart, handleDragOver, handleDrop, makeDraggable, makeResizable } from './dragDrop.js';
import { getState as getBoardState, addNote, removeNote, saveBoardContent, restoreNoteFromState } from './boardState.js';
import { logout } from './auth.js';
import { handleNoteLinkStart, handleNoteLinkUpdate, handleNoteLinkEnd, getLinkMode, setLinkMode } from './links.js';

let linkMode = false;

// Флаг для отслеживания перетаскивания заметки
let isNoteDragging = false; // NEW FLAG

// Функции для управления флагом isNoteDragging (передаются в makeDraggable)
const setNoteDragging = (value) => {
    isNoteDragging = value;
};
const getIsNoteDragging = () => isNoteDragging; // Optional: if needed elsewhere

// --- Drag-to-pan (движение камеры) ---
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let panMoved = false;
let boardScale = 1;
let currentPanX = 0;
let currentPanY = 0;

const getBoardScale = () => boardScale;
const getPanX = () => currentPanX;
const getPanY = () => currentPanY;

function setBoardScale(scale, centerX, centerY) {
  scale = Math.max(0.3, Math.min(2.0, scale));
  const board = document.getElementById('board');
  const boardRect = board.getBoundingClientRect();
  const prevScale = boardScale;
  
  // Если центр масштабирования не указан, используем текущую позицию мыши или центр видимой области
  if (centerX === undefined || centerY === undefined) {
    const container = document.getElementById('board-container');
    const containerRect = container.getBoundingClientRect();
    centerX = containerRect.left + containerRect.width / 2;
    centerY = containerRect.top + containerRect.height / 2;
  }
  
  // Вычисляем точку масштабирования относительно доски
  const pointX = centerX - boardRect.left;
  const pointY = centerY - boardRect.top;
  
  // Получаем текущее смещение
  const transform = board.style.transform || '';
  const panMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
  let panX = panMatch ? parseFloat(panMatch[1]) : 0;
  let panY = panMatch ? parseFloat(panMatch[2]) : 0;
  
  // Вычисляем новое смещение, чтобы сохранить точку масштабирования на месте
  const scaleDelta = scale / prevScale;
  panX = pointX - (pointX - panX) * scaleDelta;
  panY = pointY - (pointY - panY) * scaleDelta;
  
  // Применяем новые значения
  boardScale = scale;
  currentPanX = panX;
  currentPanY = panY;
  
  // Обновляем трансформацию
  board.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  
  // Обновляем связи
  if (window.links?.redrawLinks) {
    window.links.redrawLinks();
  }
}

function setPan(x, y) {
  const boardElem = document.getElementById('board');
  if (!boardElem) {
    return;
  }
  currentPanX = x;
  currentPanY = y;
  const transformValue = `translate(${currentPanX}px, ${currentPanY}px) scale(${boardScale})`;
  boardElem.style.transform = transformValue;
}

/**
 * Показывает подсказки при вводе в поиске
 * @param {Array} items - массив элементов для подсказок
 * @param {HTMLElement} searchInput - поле ввода поиска
 * @param {HTMLElement} searchResultsPanel - панель результатов поиска
 */
export function showSuggestions(items, searchInput, searchResultsPanel) {
  const existing = document.querySelector('.suggestions');
  if (existing) existing.remove();

  if (items.length === 0) return;

  const container = document.createElement('div');
  container.className = 'suggestions';

  items.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    div.onclick = () => {
      searchInput.value = item.name;
      const event = new Event('input');
      searchInput.dispatchEvent(event);
      container.remove();
    };
    container.appendChild(div);
  });

  searchResultsPanel.parentNode.insertBefore(container, searchResultsPanel);
}

// --- Функция для обновления размеров SVG-слоя связей ---
function updateLinksLayerSize() {
  const board = document.getElementById('board');
  const linksLayer = document.getElementById('linksLayer');
  if (board && linksLayer) {
    const width = board.offsetWidth;
    const height = board.offsetHeight;
    linksLayer.setAttribute('width', width);
    linksLayer.setAttribute('height', height);
    linksLayer.setAttribute('viewBox', `0 0 ${width} ${height}`);
    linksLayer.style.width = width + 'px';
    linksLayer.style.height = height + 'px';
    linksLayer.style.overflow = 'visible';
  }
}

/**
 * Показывает детали заклинания в модальном окне
 * @param {Object} spell - объект заклинания
 * @param {HTMLElement} modal - элемент модального окна
 * @param {HTMLElement} modalHeader - заголовок модального окна
 * @param {HTMLElement} modalContent - содержимое модального окна
 */
export function showSpellDetails(spell, modal, modalHeader, modalContent) {
  modalHeader.innerHTML = '';
  modalContent.innerHTML = `
    <div class="stat-block-modal unified-modal">
      <div class="unified-header">
        <h2>${spell.name || 'Безымянное заклинание'}</h2>
        <div class="unified-meta">
          ${spell.level > 0 ? `<span class='meta-label'>${spell.level} уровень</span>` : '<span class="meta-label">Заговор</span>'}${spell.school ? ` • <span class='meta-label'>${spell.school}</span>` : ''}
        </div>
      </div>
      <div class="unified-blocks spell-blocks" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px 18px;">
        <div class="unified-detail"><i class="fa fa-hourglass-half"></i> <label>Время:</label> ${spell.castingTime}</div>
        <div class="unified-detail"><i class="fa fa-bullseye"></i> <label>Дистанция:</label> ${spell.range}</div>
        <div class="unified-detail"><i class="fa fa-clock"></i> <label>Длительность:</label> ${spell.duration}</div>
        ${spell.materials ? `<div class="unified-detail"><i class="fa fa-gem"></i> <label>Материалы:</label> ${spell.materials}</div>` : ''}
        <div class="unified-detail"><i class="fa fa-flask"></i> <label>Компоненты:</label> ${Array.isArray(spell.components) ? spell.components.join(', ') : spell.components}</div>
      </div>
      <div class="unified-description">${spell.desc || '—'}</div>
      <div class="unified-source source-tooltip" data-full-source="${spell.sourceFull || spell.source || ''}">Источник: ${spell.sourceFull || spell.source || ''}</div>
    </div>
  `;
  document.querySelectorAll('.modal.active').forEach(m => { if (m !== modal) m.classList.remove('active'); });
  modal.classList.add('active');
}

/**
 * Показывает детали предмета, артефакта или монстра в модальном окне
 * @param {Object} item - объект элемента
 * @param {string} type - тип элемента (artifacts, items, monsters)
 * @param {HTMLElement} modal - элемент модального окна
 * @param {HTMLElement} modalHeader - заголовок модального окна
 * @param {HTMLElement} modalContent - содержимое модального окна
 */
export function showItemDetails(item, type, modal, modalHeader, modalContent) {
  modalHeader.innerHTML = '';
  modalContent.innerHTML = '';
  let content = '';
  if (type === 'monsters') {
    content = `
      <div class="stat-block-modal unified-modal">
        <div class="unified-header">
          <h2>${item.name}</h2>
          <div class="unified-meta">
            <span class='meta-label'>${item.size ? item.size + ', ' : ''}${item.type || 'Существо'}</span>${item.cr ? ` • <span class='meta-label'>CR ${item.cr}</span>` : ''}
          </div>
        </div>
        <div class="monster-params-row" style="margin-bottom: 10px;">
          ${item.ac ? `<div class="unified-detail" style="min-width:90px;"><i class='fa fa-shield-alt'></i> <label>КД:</label> ${item.ac}</div>` : ''}
          ${item.hp ? `<div class="unified-detail" style="min-width:110px;"><i class='fa fa-heart'></i> <label>Хиты:</label> ${item.hp}</div>` : ''}
        </div>
        <div class="ability-scores">
          <div class="ability"><label>STR</label>${item.str || '-'}</div>
          <div class="ability"><label>DEX</label>${item.dex || '-'}</div>
          <div class="ability"><label>CON</label>${item.con || '-'}</div>
          <div class="ability"><label>INT</label>${item.int || '-'}</div>
          <div class="ability"><label>WIS</label>${item.wis || '-'}</div>
          <div class="ability"><label>CHA</label>${item.cha || '-'}</div>
        </div>
        <div class="unified-blocks monster-blocks">
          ${item.speed ? `<div class="unified-detail"><i class='fa fa-running'></i> <label>Скорость:</label> ${item.speed}</div>` : ''}
          ${item.alignment ? `<div class="unified-detail"><i class='fa fa-balance-scale'></i> <label>Мировоззрение:</label> ${item.alignment}</div>` : ''}
          ${item.save ? `<div class="unified-detail"><i class='fa fa-dice-d20'></i> <label>Спасброски:</label> ${item.save}</div>` : ''}
          ${item.skill ? `<div class="unified-detail"><i class='fa fa-brain'></i> <label>Навыки:</label> ${item.skill}</div>` : ''}
          ${item.resist ? `<div class="unified-detail"><i class='fa fa-shield-virus'></i> <label>Сопротивления:</label> ${item.resist}</div>` : ''}
          ${item.immune ? `<div class="unified-detail"><i class='fa fa-virus'></i> <label>Иммунитеты:</label> ${item.immune}</div>` : ''}
          ${item.conditionImmune ? `<div class="unified-detail"><i class='fa fa-ban'></i> <label>Иммунитеты к состояниям:</label> ${item.conditionImmune}</div>` : ''}
          ${item.senses ? `<div class="unified-detail"><i class='fa fa-eye'></i> <label>Чувства:</label> ${item.senses}</div>` : ''}
          ${item.languages ? `<div class="unified-detail"><i class='fa fa-language'></i> <label>Языки:</label> ${item.languages}</div>` : ''}
        </div>
        <div class="unified-description">${item.desc || item.fiction || '—'}</div>
        <div class="unified-source source-tooltip" data-full-source="${item.sourceFull}">Источник: ${item.source}</div>
      </div>
    `;
  } else if (type === 'artifacts' || type === 'items') {
    let itemType = item.typeRu || '';
    if (!itemType && item.type && typeof oTypes === 'object' && oTypes[item.type.toLowerCase()]) {
      itemType = oTypes[item.type.toLowerCase()].text?.ru?.title || item.type;
    }
    if (!itemType && item.type) itemType = item.type;
    if (!itemType) itemType = 'Неизвестный тип';
    let typeAdditions = '';
    if (item.typeAdditions) {
      typeAdditions = ` (${item.typeAdditions})`;
    }
    content = `
      <div class="stat-block-modal unified-modal">
        <div class="unified-header">
          <h2>${item.name}</h2>
          <div class="unified-meta">
            <span class='meta-label'>${itemType}${typeAdditions}</span>${item.rarity ? ` • <span class='meta-label'>${item.rarity}</span>` : ''}
            ${item.attunement ? `<span class='meta-label' title='Требует настройки'><i class='fa fa-link'></i> ${item.attunement}</span>` : ''}
          </div>
        </div>
        <div class="unified-blocks">
          ${item.coast ? `<div class='unified-detail'><i class='fa fa-coins'></i> <label>Стоимость:</label> ${
            typeof item.coast === 'object' && item.coast.display
              ? `<span class="currency-tooltip" title="${item.coast.tooltip}">${item.coast.display}</span>`
              : item.coast
          }</div>` : ''}
          ${item.weight ? `<div class='unified-detail'><i class='fa fa-balance-scale'></i> <label>Вес:</label> ${item.weight} фнт.</div>` : ''}
          ${item.ac ? `<div class='unified-detail'><i class='fa fa-shield-alt'></i> <label>КД:</label> ${item.ac}</div>` : ''}
          ${item.damageVal && item.damageType ? `<div class='unified-detail'><i class='fa fa-bolt'></i> <label>Урон:</label> ${item.damageVal} ${item.damageType}</div>` : ''}
          ${item.props && item.props.length > 0 ? `<div class='unified-detail'><i class='fa fa-list'></i> <label>Свойства:</label> ${item.props.join(', ')}</div>` : ''}
        </div>
        ${(() => {
          let desc = item.desc || item.text || (item.ru && item.ru.text) || (item.en && item.en.text) || '';
          if (desc && desc.trim() !== '—') {
            return `<div class="unified-description">${desc}</div>`;
          } else {
            return '';
          }
        })()}
        <div class="unified-source source-tooltip" data-full-source="${item.sourceFull}">Источник: ${item.source}</div>
      </div>
    `;
  } else if (type === 'spells') {
    showSpellDetails(item, modal, modalHeader, modalContent);
    return;
  }
  modalContent.innerHTML = content;
  modal.classList.add('active');
}

// Вспомогательная функция для создания DOM-элемента заметки
// Эта функция только создает элемент, не добавляет его в DOM и не применяет обработчики перетаскивания/размера/клика
function createNoteElement(item, type, id = null, pos = null, dataSetsArg = null, isLoading = false) {
    const noteId = id || `${type}_${item.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const noteType = type;

    if (!pos) {
        return null; // Position is required
    }

    const note = document.createElement('div');
    note.className = `note type-${type}`;
    note.id = noteId;
    note.dataset.type = noteType;
    note.dataset.itemId = item.id;
    note.dataset.itemType = item.type;

    // Защита от невалидных размеров, но с сохранением существующих значений
    let width = parseFloat(pos.width);
    let height = parseFloat(pos.height);
    if (!width || isNaN(width) || width < 60) width = 250;
    if (!height || isNaN(height) || height < 140) height = 140;

    // Универсально поддерживаем старые поля left/top и новые x/y
    let x = pos.x;
    let y = pos.y;
    if (typeof x !== 'number' && typeof pos.left === 'number') x = pos.left;
    if (typeof y !== 'number' && typeof pos.top === 'number') y = pos.top;
    if (typeof x !== 'number') x = 0;
    if (typeof y !== 'number') y = 0;

    note.style.transform = `translate(${x}px, ${y}px)`;
    note.style.width = `${width}px`;
    note.style.height = `${height}px`;
    note.style.position = 'absolute';
    note.style.boxSizing = 'border-box';
    note.style.maxWidth = '';
    note.style.maxHeight = '';

    if (type !== 'custom') {
        note.innerHTML = window.createBoardNoteCard(item, type);
        // Не добавляем кнопку удаления вручную! Она уже есть в createCompactCard
        // Add click handlers for non-custom notes
        let wasDragged = false;
        note.addEventListener('mousedown', () => { wasDragged = false; });
        note.addEventListener('mousemove', () => { wasDragged = true; });
        note.addEventListener('mouseup', (e) => {
          if (wasDragged || e.target.closest('.delete-btn')) {
            wasDragged = false;
            return;
          }
          const noteData = getBoardState()?.notes.find(n => n.id === note.id);
          if (noteData && noteData.type !== 'custom') {
            let itemData = null;
            const ds = dataSetsArg || window.dataSets;
            // Для spells ищем только в spells
            if (noteData.type === 'spells' && ds && ds.spells) {
              itemData = ds.spells.find(item => item.id === noteData.itemId);
            } else if (noteData.type === 'items' && ds && (ds.items || ds.allItems)) {
              itemData = (ds.items || ds.allItems).find(item => item.id === noteData.itemId);
            } else if (noteData.type === 'artifacts' && ds && (ds.artifacts || ds.allArt)) {
              itemData = (ds.artifacts || ds.allArt).find(item => item.id === noteData.itemId);
            } else if (ds && noteData.type && ds[noteData.type]) {
              itemData = ds[noteData.type].find(item => item.id === noteData.itemId);
            }
            // Если не найдено — берем снапшот или noteData
            if (!itemData) itemData = noteData.itemSnapshot || noteData;
            if (!itemData || !itemData.name) {
              wasDragged = false;
              return;
            }
            const modal = document.getElementById('modal');
            const modalHeader = document.getElementById('modalHeader');
            const modalContent = document.getElementById('modalContent');
            showItemDetails(itemData, noteData.type, modal, modalHeader, modalContent);
          }
          wasDragged = false;
        });
    } else {
        // Structure for custom note
        const noteHeader = document.createElement('div');
        noteHeader.className = 'note-header';
        noteHeader.style.display = 'flex';
        noteHeader.style.alignItems = 'center';
        noteHeader.style.position = 'relative';

        // Кнопка удаления справа
        let delBtn = noteHeader.querySelector('.note-del-btn');
        if (!delBtn) {
          delBtn = document.createElement('button');
          delBtn.className = 'note-del-btn';
          delBtn.title = 'Удалить';
          delBtn.textContent = '✖';
          delBtn.style.order = '2';
          delBtn.style.marginLeft = 'auto';
        }
        noteHeader.appendChild(delBtn);

        const noteTitle = document.createElement('div');
        noteTitle.className = 'note-title';
        noteTitle.textContent = item.title || item.name || 'Новая заметка';
        noteTitle.contentEditable = 'false';
        noteTitle.style.order = '1';
        noteTitle.style.flex = '1';
        
        // Add title editing handlers
        noteTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (noteTitle.contentEditable === 'true') return;
            noteTitle.contentEditable = 'true';
            noteTitle.focus();
            const range = document.createRange();
            range.selectNodeContents(noteTitle);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });

        noteTitle.addEventListener('blur', async () => {
            noteTitle.contentEditable = 'false';
            noteTitle.classList.remove('editing');
            window.getSelection()?.removeAllRanges();
            const noteData = getBoardState()?.notes.find(n => n.id === note.id);
            if (noteData && noteData.custom) {
                noteData.custom.title = noteTitle.textContent || '';
                if (typeof window.saveBoardToServer === 'function') {
                    await window.saveBoardToServer();
                }
            }
        });

        noteTitle.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                noteTitle.contentEditable = 'false';
                noteTitle.blur();
            }
        });

        noteHeader.appendChild(noteTitle);
        note.appendChild(noteHeader);

        const noteBody = document.createElement('div');
        noteBody.className = 'note-body';
        noteBody.textContent = item.body || '';
        noteBody.contentEditable = 'false';
        
        // Add body editing handlers
        noteBody.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            noteBody.contentEditable = 'true';
            noteBody.focus();
            const range = document.createRange();
            range.selectNodeContents(noteBody);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });

        noteBody.addEventListener('blur', async () => {
            noteBody.contentEditable = 'false';
            noteBody.classList.remove('editing');
            window.getSelection()?.removeAllRanges();
            const noteData = getBoardState()?.notes.find(n => n.id === note.id);
            if (noteData && noteData.custom) {
                noteData.custom.body = noteBody.textContent || '';
                if (typeof window.saveBoardToServer === 'function') {
                    await window.saveBoardToServer();
                }
            }
        });

        noteBody.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                noteBody.contentEditable = 'false';
                noteBody.blur();
            }
        });

        note.appendChild(noteBody);
    }

    // После создания noteElement (для всех типов, и новых, и загруженных)
    // 1. Обработчик удаления
    const delBtn = note.querySelector('.delete-btn, .note-del-btn');
    if (delBtn) {
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        note.remove();
        removeNote(noteId);
        if (typeof window.saveBoardToServer === 'function') {
          await window.saveBoardToServer();
        }
      };
    }
    // 2. Обработчик открытия модального окна для всех типов, кроме custom
    if (noteType !== 'custom') {
      const modal = document.getElementById('modal');
      const modalHeader = document.getElementById('modalHeader');
      const modalContent = document.getElementById('modalContent');
      let wasDragged = false;
      note.addEventListener('mousedown', () => { wasDragged = false; });
      note.addEventListener('mousemove', () => { wasDragged = true; });
      note.addEventListener('mouseup', (e) => {
        if (wasDragged || e.target.closest('.delete-btn')) {
          wasDragged = false;
          return;
        }
        const noteData = getBoardState()?.notes.find(n => n.id === note.id);
        if (noteData && noteData.type !== 'custom') {
          let itemData = null;
          const ds = dataSetsArg || window.dataSets;
          // Для spells ищем только в spells
          if (noteData.type === 'spells' && ds && ds.spells) {
            itemData = ds.spells.find(item => item.id === noteData.itemId);
          } else if (noteData.type === 'items' && ds && (ds.items || ds.allItems)) {
            itemData = (ds.items || ds.allItems).find(item => item.id === noteData.itemId);
          } else if (noteData.type === 'artifacts' && ds && (ds.artifacts || ds.allArt)) {
            itemData = (ds.artifacts || ds.allArt).find(item => item.id === noteData.itemId);
          } else if (ds && noteData.type && ds[noteData.type]) {
            itemData = ds[noteData.type].find(item => item.id === noteData.itemId);
          }
          // Если не найдено — берем снапшот или noteData
          if (!itemData) itemData = noteData.itemSnapshot || noteData;
          if (!itemData || !itemData.name) {
            wasDragged = false;
            return;
          }
          if (noteData.type === 'spells') {
            showSpellDetails(itemData, modal, modalHeader, modalContent);
          } else {
            showItemDetails(itemData, noteData.type, modal, modalHeader, modalContent);
          }
        }
        wasDragged = false;
      });
    }

    return note;
}

/**
 * Добавляет элемент на доску заметок
 * @param {Object} item - данные элемента
 * @param {string} type - тип элемента
 * @param {string|null} id - id заметки (если есть)
 * @param {Object|null} pos - позиция и размеры {left, top, width, height}
 * @param {boolean} isLoading - флаг загрузки из состояния
 * @param {HTMLElement} board - элемент доски
 * @param {Function} saveState - функция сохранения состояния (saveBoardToServer)
 * @param {Function} redrawLinks - функция перерисовки связей
 * @param {Function} addNoteFunc - функция добавления заметки в состояние (из boardState.js)
 * @param {Function} getBoardScale - функция получения текущего масштаба доски
 * @returns {HTMLElement} созданный элемент заметки
 */
export function addToBoard(item, type, id = null, pos = null, isLoading = false, board, saveState, redrawLinks, addNoteFunc, getBoardScale, dataSetsArg = null) {
     if (!pos && !isLoading) { // Если не загрузка из состояния И нет позиции
        return null;
     } else if (!pos && isLoading) {
          return null;
     }


    // Создаем только DOM-элемент заметки
    const noteElement = createNoteElement(item, type, id, pos, dataSetsArg, isLoading);

    if (!noteElement) {
        return null;
    }

    const noteId = noteElement.id; // Получаем сгенерированный или переданный ID
    const noteType = noteElement.dataset.type;


    if (!isLoading) {
        // Это новый элемент, добавляем его в состояние
        // Получаем x/y из transform
        let x = 0, y = 0;
        const match = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(noteElement.style.transform || '');
        if (match) {
          x = parseFloat(match[1]);
          y = parseFloat(match[2]);
        }
        addNoteFunc({
            id: noteId,
            type: noteType,
            itemId: type !== 'custom' ? item.id : undefined,
            itemType: type !== 'custom' ? (['monsters','artifacts','items','spells'].includes(type) ? type : (item.typeRu || item.type || type)) : undefined,
            itemSnapshot: type !== 'custom' ? JSON.parse(JSON.stringify(item)) : undefined,
            custom: type === 'custom' ? {
                title: item.title || item.name || 'Новая заметка',
                body: item.body || ''
            } : undefined,
            pos: {
               x: x,
               y: y,
               width: parseFloat(noteElement.style.width),
               height: parseFloat(noteElement.style.height)
            }
        });

        // Добавляем элемент на доску (если он не был добавлен ранее в bindUI при загрузке)
        // При загрузке элементы добавляются через фрагмент в bindUI
        // При drop с панели поиска, элемент нужно добавить здесь
        board.appendChild(noteElement);

        // Применяем обработчики перетаскивания и изменения размера к новому элементу
         makeDraggable(noteElement, board, document.getElementById('linksLayer'), redrawLinks, updateLinksLayerSize, getBoardScale, setNoteDragging);
         if (noteType === 'custom') {
           makeResizable(noteElement, () => { updateLinksLayerSize(); });
         }

        // Для новых НЕ custom заметок, добавляем обработчик клика для showItemDetails
        if (noteType !== 'custom') {
             const modal = document.getElementById('modal'); // Предполагаем, что modal доступен
             const modalHeader = document.getElementById('modalHeader'); // Предполагаем, что modalHeader доступен
             const modalContent = document.getElementById('modalContent'); // Предполагаем, что modalContent доступен
             const delBtn = noteElement.querySelector('.delete-btn');

            let wasDragged = false; // Флаг для предотвращения открытия при перетаскивании
            noteElement.addEventListener('mousedown', () => { wasDragged = false; });
            noteElement.addEventListener('mousemove', () => { wasDragged = true; });
            noteElement.addEventListener('mouseup', (e) => {
              if (wasDragged || e.target.closest('.delete-btn')) {
                wasDragged = false;
                return;
              }
              const noteData = getBoardState()?.notes.find(n => n.id === noteElement.id);
              if (noteData && noteData.type !== 'custom') {
                let itemData = null;
                const ds = dataSetsArg || window.dataSets;
                // Для spells ищем только в spells
                if (noteData.type === 'spells' && ds && ds.spells) {
                  itemData = ds.spells.find(item => item.id === noteData.itemId);
                } else if (noteData.type === 'items' && ds && (ds.items || ds.allItems)) {
                  itemData = (ds.items || ds.allItems).find(item => item.id === noteData.itemId);
                } else if (noteData.type === 'artifacts' && ds && (ds.artifacts || ds.allArt)) {
                  itemData = (ds.artifacts || ds.allArt).find(item => item.id === noteData.itemId);
                } else if (ds && noteData.type && ds[noteData.type]) {
                  itemData = ds[noteData.type].find(item => item.id === noteData.itemId);
                }
                // Если не найдено — берем снапшот или noteData
                if (!itemData) itemData = noteData.itemSnapshot || noteData;
                if (!itemData || !itemData.name) {
                  wasDragged = false;
                  return;
                }
                showItemDetails(itemData, noteData.type, modal, modalHeader, modalContent);
              }
              wasDragged = false;
            });
             // Добавляем тач-обработчик для открытия деталей
             noteElement.addEventListener('touchend', (e) => {
                if (noteElement.dataset.wasDragged === 'true' || e.target.closest('.delete-btn')) {
                  noteElement.dataset.wasDragged = 'false';
                  return;}
                 showItemDetails(item, noteType, modal, modalHeader, modalContent);
                 noteElement.dataset.wasDragged = 'false';
             });
        } else {
             // Для новых custom заметок, добавляем обработчики редактирования
              const noteTitle = noteElement.querySelector('.note-title');
              const noteBody = noteElement.querySelector('.note-body');

              noteTitle.contentEditable = 'false';
              noteTitle.addEventListener('focus', () => noteTitle.classList.add('editing'));
              noteTitle.addEventListener('blur', async () => {
                noteTitle.classList.remove('editing');
                window.getSelection()?.removeAllRanges();
                console.log('Custom note title blurred (drop), saving...');
                // Update the state before saving
                const noteData = getBoardState()?.notes.find(n => n.id === noteElement.id);
                if (noteData && noteData.custom) {
                  noteData.custom.title = noteTitle.textContent || '';
                   if (typeof window.saveBoardToServer === 'function') await window.saveBoardToServer();
                   console.log('Custom note title saved');
                }
              });
              noteTitle.addEventListener('keydown', async (event) => {
                 if (event.key === 'Enter') {
                     event.preventDefault();
                     noteTitle.contentEditable = 'false';
                     noteTitle.blur();
                 }
             });
              noteTitle.addEventListener('click', (e) => {
                e.stopPropagation();
                noteTitle.contentEditable = 'true';
                noteTitle.focus();
                const range = document.createRange();
                range.selectNodeContents(noteTitle);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              });

              noteBody.contentEditable = 'false';
              noteBody.addEventListener('focus', () => noteBody.classList.add('editing'));
              noteBody.addEventListener('blur', async () => {
                noteBody.contentEditable = 'false';
                noteBody.classList.remove('editing');
                window.getSelection()?.removeAllRanges();
                console.log('Custom note body blurred (drop), saving...');
                // Update the state before saving
                 const noteData = getBoardState()?.notes.find(n => n.id === noteElement.id);
                if (noteData && noteData.custom) {
                  noteData.custom.body = noteBody.textContent || '';
                   if (typeof window.saveBoardToServer === 'function') await window.saveBoardToServer();
                  console.log('Custom note body saved');
                }
              });
              noteBody.addEventListener('keydown', async (event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      noteBody.contentEditable = 'false';
                      noteBody.blur();
                  }
              });
              noteBody.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                noteBody.contentEditable = 'true';
                noteBody.focus();
                const range = document.createRange();
                range.selectNodeContents(noteBody);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              });

                  // Добавляем обработчик для кнопки удаления
                  const delBtn = noteElement.querySelector('.note-del-btn');
                   if(delBtn) {
                       delBtn.onclick = async () => {
                           console.log('Deleting note (drop)', noteElement.id);
                           noteElement.remove();
                            // Удаляем заметку из глобального состояния через removeNote из boardState.js
                           removeNote(noteId); // Используем removeNote из boardState.js
                            console.log('Note removed from state (drop)', getBoardState().notes); // Используем getBoardState()
                           // Сохраняем состояние доски на сервере после удаления
                           if (typeof window.saveBoardToServer === 'function') {
                                await window.saveBoardToServer(); // Сохраняем
                                console.log('State saved after deleting note (drop)');
                           } else { console.error('saveBoardToServer function not found after deleting note (drop)'); }
                           console.log('Note deletion complete (drop)');
                       };
                   } else { console.error('Delete button not found for new custom note (drop)'); }
        }


    } else {
        // Это элемент, загруженный из состояния.
        // Он уже должен быть в currentState.notes.
        // Его добавляют на доску через DocumentFragment в bindUI.
        // Обработчики перетаскивания и изменения размера применяются к нему в bindUI после добавления всех элементов.
        // Обработчики кликов для showItemDetails/редактирования custom заметок также применяются в bindUI.
    }


    // Возвращаем созданный элемент
    return noteElement;
}

// === КАСТОМНОЕ КОНТЕКСТНОЕ МЕНЮ ДЛЯ ДОСКИ ===
function createBoardContextMenu() {
  let menu = document.getElementById('customContextMenu');
  if (menu) return menu;
  menu = document.createElement('div');
  menu.id = 'customContextMenu';
  menu.style.display = 'none';
  menu.innerHTML = `<button id="addNoteContextBtn" type="button">➕ Добавить заметку</button>`;
  document.body.appendChild(menu);
  return menu;
}

// Add board scaling and panning
function initBoardPanAndZoom(board) {
  const boardContainer = document.getElementById('board-container');
  if (!boardContainer) return;

  let isPanning = false;
  let lastX = 0;
  let lastY = 0;
  let panX = 0;
  let panY = 0;
  let scale = 1;

  // Mouse wheel zoom
  boardContainer.addEventListener('wheel', (e) => {
    if (e.target.closest('.note')) return;
    
    e.preventDefault();
    const delta = e.deltaY;
    const scaleChange = delta > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(2.0, scale * scaleChange));
    
    const rect = boardContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleDiff = newScale - scale;
    panX -= (mouseX * scaleDiff) / scale;
    panY -= (mouseY * scaleDiff) / scale;
    
    scale = newScale;
    boardScale = scale;
    updateBoardTransform();
  });

  // Pan with middle mouse button or left mouse on empty board area
  boardContainer.addEventListener('mousedown', (e) => {
    if (e.target.closest('.note') || linkMode) return;
    
    if (e.button === 1 || (e.button === 0 && !e.target.closest('.note'))) {
      e.preventDefault();
      isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      boardContainer.style.cursor = 'grabbing';
    }
  });

  boardContainer.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    
    e.preventDefault();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    
    panX += dx;
    panY += dy;
    
    lastX = e.clientX;
    lastY = e.clientY;
    
    currentPanX = panX;
    currentPanY = panY;
    updateBoardTransform();
  });

  const stopPanning = (e) => {
    if (!isPanning) return;
    
    e.preventDefault();
    isPanning = false;
    boardContainer.style.cursor = '';
  };

  boardContainer.addEventListener('mouseup', stopPanning);
  boardContainer.addEventListener('mouseleave', stopPanning);

  function updateBoardTransform() {
    board.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    if (typeof window.redrawLinksWithLayer === 'function') {
      window.redrawLinksWithLayer();
    }
  }

  // Export functions to window
  window.getBoardScale = () => scale;
  window.setPan = (x, y) => {
    panX = x;
    panY = y;
    currentPanX = x;
    currentPanY = y;
    updateBoardTransform();
  };
  window.setBoardScale = (newScale) => {
    scale = Math.max(0.3, Math.min(2.0, newScale));
    boardScale = scale;
    updateBoardTransform();
  };
}

function toggleLinkMode() {
  const linkModeBtn = document.getElementById('linkModeBtn');
  if (!linkModeBtn) {
    console.error('Link mode button not found!');
    return;
  }
  
  const isActive = linkModeBtn.classList.toggle('active');
  console.log('UI: Link mode toggled to:', isActive);
  
  // Обновляем состояние режима связей
  if (typeof window.links !== 'undefined' && typeof window.links.setLinkMode === 'function') {
    window.links.setLinkMode(isActive);
  } else {
    console.error('UI: Links module or setLinkMode function not found!');
  }
}

/**
 * Инициализация UI и привязка обработчиков событий
 * @param {Object} elements - объект с элементами UI
 * @param {Object} dataSets - объект с данными (spells, allArt, allItems, monsters)
 * @param {Function} addToBoard - функция добавления элемента на доску
 * @param {Function} saveBoardToServer - функция сохранения состояния на сервере
 * @param {Function} getBoardStateFunc - функция получения состояния доски (getState из boardState.js)
 * @param {Function} redrawLinks - функция перерисовки связей (redrawLinksWithLayer)
 * @param {Function} makeDraggable - функция для drag&drop
 * @param {Function} makeResizable - функция для изменения размера
 * @param {Function} setLinkMode - функция для управления режимом связей
 */
export async function bindUI(elements, dataSets, addToBoard, saveBoardToServer, getBoardStateFunc, redrawLinks, makeDraggable, makeResizable, setLinkMode) {
  console.log('bindUI called', { elements });
  const {
    searchViewBtn,
    boardSec,
    searchSec,
    searchBtn,
    searchInput,
    searchType,
    searchResultsPanel,
    board,
    linksLayer,
    modal,
    modalHeader,
    modalContent,
    modalClose,
    addNoteBtn,
    linkModeBtn,
    clearBoardBtn,
    diceRollBtn,
    linkPopover,
    unlinkBtn,
    searchPanelCloseBtn,
    floatingSearchBtn,
    mainMenuBtn
  } = elements;

  if (addNoteBtn) {
    console.log('addNoteBtn найден', addNoteBtn);
    addNoteBtn.addEventListener('click', () => console.log('Клик по addNoteBtn'));
  } else {
    console.log('addNoteBtn НЕ найден');
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    console.log('logoutBtn найден', logoutBtn);
    logoutBtn.addEventListener('click', () => console.log('Клик по logoutBtn'));
  } else {
    console.log('logoutBtn НЕ найден');
  }

  // Добавляем обработчики для аккаунта (актуально для index.html и account.html)
  const accountBtn = document.getElementById('accountBtn');
  const accountMenu = document.getElementById('accountMenu');

  if (accountBtn && accountMenu) {
     console.log('bindUI: Account button and menu found, adding listeners');
    accountBtn.addEventListener('click', (e) => {
       e.stopPropagation(); // Предотвращаем закрытие меню при клике на кнопке
      accountMenu.classList.toggle('active');
    });

    // Закрываем меню при клике вне его
    document.addEventListener('click', (e) => {
      if (!accountBtn.contains(e.target) && !accountMenu.contains(e.target)) {
        accountMenu.classList.remove('active');
      }
    });
  } else {
      console.log('bindUI: Account button or menu not found, skipping account listeners');
  }

  // Обработчики поиска (актуально для board.html)
  if (searchInput && searchType && searchResultsPanel) {
    console.log('Initializing search functionality');
    
    // Clear any existing event listeners
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    const newSearchType = searchType.cloneNode(true);
    searchType.parentNode.replaceChild(newSearchType, searchType);
    
    // Add search input handler
    newSearchInput.addEventListener('input', () => {
      if (newSearchType.value === 'spells' && dataSets.spells && dataSets.spells.length > 0) {
        const suggestions = dataSets.spells.filter(spell =>
          spell.name.toLowerCase().startsWith(newSearchInput.value.toLowerCase())
        ).slice(0, 5);
        showSuggestions(suggestions, newSearchInput, searchResultsPanel);
      }
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        try {
          let currentDataSet = (newSearchType.value === 'artifacts') ? dataSets.allArt :
                              (newSearchType.value === 'items') ? dataSets.allItems :
                              dataSets[newSearchType.value];
          if (!currentDataSet || currentDataSet.length === 0) {
            searchResultsPanel.innerHTML = '<div class="search-error">Нет данных для поиска в этой категории</div>';
            return;
          }
          const results = performSearch(newSearchInput.value, newSearchType.value, dataSets);
          if (results) {
            displaySearchResults(results, newSearchType.value, searchResultsPanel,
              spell => showSpellDetails(spell, modal, modalHeader, modalContent),
              (item, type) => showItemDetails(item, type, modal, modalHeader, modalContent));
          }
        } catch (error) {
          console.error('Search error:', error);
          searchResultsPanel.innerHTML = '<div class="search-error">Ошибка поиска. Попробуйте позже.</div>';
        }
      }, 300);
    });

    // Add search type change handler
    newSearchType.addEventListener('change', () => {
      try {
        let currentDataSet = (newSearchType.value === 'artifacts') ? dataSets.allArt :
                            (newSearchType.value === 'items') ? dataSets.allItems :
                            dataSets[newSearchType.value];
        if (!currentDataSet || currentDataSet.length === 0) {
          searchResultsPanel.innerHTML = '<div class="search-error">Нет данных для поиска в этой категории</div>';
          return;
        }
        const results = performSearch(newSearchInput.value, newSearchType.value, dataSets);
        if (results) {
          displaySearchResults(results, newSearchType.value, searchResultsPanel,
            spell => showSpellDetails(spell, modal, modalHeader, modalContent),
            (item, type) => showItemDetails(item, type, modal, modalHeader, modalContent));
        }
      } catch (error) {
        console.error('Search error:', error);
        searchResultsPanel.innerHTML = '<div class="search-error">Ошибка поиска. Попробуйте позже.</div>';
      }
    });

    // Add search button handler
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const results = performSearch(newSearchInput.value, newSearchType.value, dataSets);
        displaySearchResults(results, newSearchType.value, searchResultsPanel,
          spell => showSpellDetails(spell, modal, modalHeader, modalContent),
          (item, type) => showItemDetails(item, type, modal, modalHeader, modalContent));
      });
    }

    document.addEventListener('click', (e) => {
      const suggestions = document.querySelector('.suggestions');
      if (suggestions && !suggestions.contains(e.target) && e.target !== newSearchInput) {
        suggestions.remove();
        console.log('bindUI: Suggestions closed on outside click');
      }
    });

  } else {
       console.log('bindUI: Search elements not found, skipping search listeners');
  }


  // Обработчики переключения вида поиска/доски
  if (searchViewBtn) {
    console.log('bindUI: Search button found, adding listener');
    // Новый обработчик для боковой панели поиска:
    searchViewBtn.addEventListener('click', () => {
      document.getElementById('search-sidebar').classList.add('active');
    });
  } else {
    console.error('Search button not found');
  }

  // Add floating search button handler
  if (floatingSearchBtn) {
    floatingSearchBtn.addEventListener('click', () => {
      // Reset zoom and pan
      setBoardScale(1);
      setPan(0, 0);
    });
  }

  // Обработчик закрытия панели поиска (актуально для board.html)
  if (searchPanelCloseBtn && searchSec) {
      console.log('bindUI: Search panel close button and section found, adding listener');
      searchPanelCloseBtn.addEventListener('click', () => {
        if (searchSec) {
          searchSec.classList.add('hidden');
          console.log('bindUI: Search panel closed');
        }
      });
  } else {
      console.log('bindUI: Search panel close button or search section not found');
  }


  // Обработчики для модальных окон (актуально для board.html и других страниц с модалками)
  if (modalClose && modal) {
    console.log('bindUI: Modal close elements found, adding listener');
    modalClose.addEventListener('click', () => modal.classList.remove('active'));
  } else {
      console.log('bindUI: Modal close button or modal not found, skipping modal close listener');
  }

  // Обработчики для системы связей (актуально для board.html)
  if (linkModeBtn) {
      console.log('bindUI: Link mode button found, adding listener');
      linkModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLinkMode();
      });
  } else {
      console.log('bindUI: Link mode button not found, skipping link mode listener');
  }

  if (unlinkBtn && linkPopover) {
    console.log('bindUI: Unlink button and link popover found, adding listener');
    unlinkBtn.addEventListener('click', () => {
      const [from, to] = linkPopover.dataset.connection?.split('-') || [];
      // Используем window.state для обновления глобального состояния доски
      if (window.state && window.state.connections) {
         window.state.connections = window.state.connections.filter(c => !(c.from === from && c.to === to));
          console.log('bindUI: Connection removed from state', window.state.connections);
      } else {
          console.error('bindUI: Cannot remove connection, window.state or connections not found');
      }

      redrawLinks(); // Перерисовываем связи после удаления
      if (typeof window.saveBoardToServer === 'function') {
           window.saveBoardToServer(); // Сохраняем состояние после удаления связи
      } else {
          console.error('bindUI: saveBoardToServer function not found');
      }
    });
  } else {
      console.log('bindUI: Unlink button or link popover not found, skipping unlink listener');
  }


  // Обработчики перетаскивания из панели поиска на доску (актуально для board.html)
  const boardContainer = document.getElementById('board-container');
   // Note: board element drag/drop handlers are now in scripts.js
  if (boardContainer) { // Check only for boardContainer as the main drop target
      console.log('bindUI: Board container found, adding drag/drop listeners for boardContainer');
      boardContainer.addEventListener('dragenter', (e) => {
        e.preventDefault();
        // Add visual cue if needed
        if (board) board.classList.add('drag-over');
         console.log('bindUI: boardContainer dragenter');
      });

      boardContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
         if (board) board.classList.add('drag-over');
         console.log('bindUI: boardContainer dragover');
      });

      boardContainer.addEventListener('dragleave', (e) => {
        const rect = boardContainer.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        // Проверяем, покинул ли курсор область board-container
        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
           if (board) board.classList.remove('drag-over');
             console.log('bindUI: boardContainer dragleave - exited container');
        } else {
            console.log('bindUI: boardContainer dragleave - inside container');
        }
      });

      boardContainer.addEventListener('drop', async (e) => {
        console.log('bindUI: boardContainer drop event');
        e.preventDefault();
        e.stopPropagation(); // Останавливаем дальнейшую обработку события
        board.classList.remove('drag-over');

        const data = e.dataTransfer.getData('text/plain');
        if (!data) {
            console.log('Drop event: No data transferred.');
            return;
        }
        console.log('Drop event: Received data', data);

        try {
          const item = JSON.parse(data);
          console.log('Drop event: Parsed item', item);
          if (!item || (!item.id && !item.type && !item.noteType && !item.name)) {
               console.error('Drop event: Invalid item data', item);
               return;
          }

          const boardRect = board.getBoundingClientRect();
          const scale = window.getBoardScale ? window.getBoardScale() : 1;
          const panX = window.getPanX ? window.getPanX() : 0;
          const panY = window.getPanY ? window.getPanY() : 0;

          // Получаем координаты мыши относительно доски с учетом масштаба и смещения
          const mouseX = (e.clientX - boardRect.left - panX) / scale;
          const mouseY = (e.clientY - boardRect.top - panY) / scale;

          const defaultWidth = 250;
          const defaultHeight = 140;

          // Центрируем заметку под курсором
          const pos = {
             x: mouseX - defaultWidth / 2,
             y: mouseY - defaultHeight / 2,
             width: defaultWidth,
             height: defaultHeight
          };
          console.log('Drop event: Calculated position', pos);

          // --- Унификация типа заметки ---
          let noteType = item.noteType;
          if (!noteType) {
            if (item.cr !== undefined) noteType = 'monsters';
            else if (item.type && ['spells','monsters','items','artifacts'].includes(item.type)) noteType = item.type;
            else if (item.typeRu && ['spells','monsters','items','artifacts'].includes(item.typeRu)) noteType = item.typeRu;
            else if (item.rarity) noteType = 'artifacts';
            else if (item.type && item.type === 'spell') noteType = 'spells';
            else noteType = 'custom';
          }
          console.log('Drop event: Determined note type', noteType);

          // Создаем новую заметку
          const newNoteElement = addToBoard(item, noteType, null, pos, false, board, window.saveBoardToServer, window.redrawLinksWithLayer, window.addNote, window.getBoardScale, dataSets);

          if (newNoteElement) {
            // Важно: Применяем обработчики перетаскивания и изменения размера
            if (typeof window.links?.getLinkMode === 'function' && window.links.getLinkMode()) {
              return;
            }
            makeDraggable(newNoteElement, board, linksLayer, redrawLinks, updateLinksLayerSize, window.getBoardScale, setNoteDragging);
            if (noteType === 'custom') {
              makeResizable(newNoteElement, () => { updateLinksLayerSize(); });
            }
            // Остальной код обработки нового элемента...
          }

        } catch (e) {
          console.error('Error processing drop event:', e);
        }
      });

      // Добавляем обработчик контекстного меню (ПКМ) на доске
      if (board) {
        console.log('bindUI: Adding contextmenu listener to board');
        const contextMenu = createBoardContextMenu();
        boardContainer.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          // Позиционируем меню
          contextMenu.style.display = 'block';
          contextMenu.style.left = e.clientX + 'px';
          contextMenu.style.top = e.clientY + 'px';
          contextMenu.style.position = 'fixed';
          contextMenu.style.zIndex = 2000;
          // Сохраняем координаты для заметки
          contextMenu.dataset.x = e.clientX;
          contextMenu.dataset.y = e.clientY;
        });
        // Добавляем обработчик на кнопку
        contextMenu.addEventListener('click', function handler(ev) {
          if (ev.target && ev.target.id === 'addNoteContextBtn') {
            // Получаем координаты
            const boardRect = board.getBoundingClientRect();
            const scale = window.getBoardScale ? window.getBoardScale() : 1;
            const panX = window.getPanX ? window.getPanX() : 0;
            const panY = window.getPanY ? window.getPanY() : 0;
            // Переводим clientX/Y в координаты доски
            const mouseX = parseFloat(contextMenu.dataset.x) - boardRect.left;
            const mouseY = parseFloat(contextMenu.dataset.y) - boardRect.top;
            const boardX = (mouseX - panX) / scale;
            const boardY = (mouseY - panY) / scale;
            const defaultWidth = 250;
            const defaultHeight = 140;
            const pos = {
              x: boardX - defaultWidth / 2,
              y: boardY - defaultHeight / 2,
              width: defaultWidth,
              height: defaultHeight
            };
            // Добавляем custom заметку
            addToBoard({ title: '', body: '' }, 'custom', null, pos, false, board, window.saveBoardToServer, redrawLinks, window.addNote, window.getBoardScale);
            contextMenu.style.display = 'none';
          }
        });
        // Скрываем меню при клике вне его
        document.addEventListener('mousedown', (ev) => {
          if (contextMenu.style.display === 'block' && !contextMenu.contains(ev.target)) {
            contextMenu.style.display = 'none';
          }
        });
        // Скрываем меню при скролле/resize
        window.addEventListener('scroll', () => { contextMenu.style.display = 'none'; });
        window.addEventListener('resize', () => { contextMenu.style.display = 'none'; });
      }

  } else {
      console.log('bindUI: Board container not found, skipping drag/drop listeners');
  }

  // Передаем getBoardScale, setPan, setBoardScale, redrawLinksWithLayer, addNote, saveBoardToServer
  // в глобальный scope, чтобы они были доступны из scripts.js
  window.getBoardScale = getBoardScale;
  window.internalSetPan = setPan; // Экспортируем как internal
  window.internalSetBoardScale = setBoardScale; // Экспортируем как internal
  window.redrawLinksWithLayer = redrawLinks; // redrawLinksWithLayer уже передается как redrawLinks
  window.addNote = addNote; // addNote уже импортируется
   // saveBoardToServer уже передается в bindUI, но для доступности в глобальной области
  window.saveBoardToServer = saveBoardToServer; // Переименовываем для ясности
  window.dataSets = dataSets; // Передаем dataSets глобально для доступа в addToBoard

  // После инициализации UI назначаем обработчики drag&drop/resize для всех заметок
  if (board) {
    const notes = board.querySelectorAll('.note');
    console.log('Initializing note handlers for', notes.length, 'notes');
    
    notes.forEach(note => {
      // Remove existing handlers
      const newNote = note.cloneNode(true);
      note.parentNode.replaceChild(newNote, note);
      
      // Add drag and resize handlers
      makeDraggable(newNote, board, linksLayer, redrawLinks, updateLinksLayerSize, getBoardScale, setNoteDragging);
      if (newNote.dataset.type === 'custom') {
        makeResizable(newNote, redrawLinks);
      }

      // Add editing handlers for custom notes
      if (newNote.dataset.type === 'custom') {
        const noteTitle = newNote.querySelector('.note-title');
        const noteBody = newNote.querySelector('.note-body');

        if (noteTitle) {
          noteTitle.contentEditable = 'false';
          noteTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (noteTitle.contentEditable === 'true') return;
            noteTitle.contentEditable = 'true';
            noteTitle.focus();
            const range = document.createRange();
            range.selectNodeContents(noteTitle);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          });

          noteTitle.addEventListener('blur', async () => {
            noteTitle.contentEditable = 'false';
            noteTitle.classList.remove('editing');
            window.getSelection()?.removeAllRanges();
            const noteData = getBoardState()?.notes.find(n => n.id === newNote.id);
            if (noteData && noteData.custom) {
              noteData.custom.title = noteTitle.textContent || '';
              if (typeof window.saveBoardToServer === 'function') {
                await window.saveBoardToServer();
              }
            }
          });

          noteTitle.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              noteTitle.contentEditable = 'false';
              noteTitle.blur();
            }
          });
        }

        if (noteBody) {
          noteBody.contentEditable = 'false';
          noteBody.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            noteBody.contentEditable = 'true';
            noteBody.focus();
            const range = document.createRange();
            range.selectNodeContents(noteBody);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          });

          noteBody.addEventListener('blur', async () => {
            noteBody.contentEditable = 'false';
            noteBody.classList.remove('editing');
            window.getSelection()?.removeAllRanges();
            const noteData = getBoardState()?.notes.find(n => n.id === newNote.id);
            if (noteData && noteData.custom) {
              noteData.custom.body = noteBody.textContent || '';
              if (typeof window.saveBoardToServer === 'function') {
                await window.saveBoardToServer();
              }
            }
          });

          noteBody.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              noteBody.contentEditable = 'false';
              noteBody.blur();
            }
          });
        }
      }

      // Add click handlers for non-custom notes
      if (newNote.dataset.type !== 'custom') {
        let wasDragged = false;
        newNote.addEventListener('mousedown', () => { wasDragged = false; });
        newNote.addEventListener('mousemove', () => { wasDragged = true; });
        newNote.addEventListener('mouseup', (e) => {
          if (wasDragged || e.target.closest('.delete-btn')) {
            wasDragged = false;
            return;
          }
          const noteData = getBoardState()?.notes.find(n => n.id === newNote.id);
          if (noteData && noteData.type !== 'custom') {
            let itemData = null;
            const ds = dataSets;
            // Для spells ищем только в spells
            if (noteData.type === 'spells' && ds && ds.spells) {
              itemData = ds.spells.find(item => item.id === noteData.itemId);
            } else if (noteData.type === 'items' && ds && (ds.items || ds.allItems)) {
              itemData = (ds.items || ds.allItems).find(item => item.id === noteData.itemId);
            } else if (noteData.type === 'artifacts' && ds && (ds.artifacts || ds.allArt)) {
              itemData = (ds.artifacts || ds.allArt).find(item => item.id === noteData.itemId);
            } else if (ds && noteData.type && ds[noteData.type]) {
              itemData = ds[noteData.type].find(item => item.id === noteData.itemId);
            }
            // Если не найдено — берем снапшот или noteData
            if (!itemData) itemData = noteData.itemSnapshot || noteData;
            if (!itemData || !itemData.name) {
              wasDragged = false;
              return;
            }
            showItemDetails(itemData, noteData.type, modal, modalHeader, modalContent);
          }
          wasDragged = false;
        });
      }
    });
  }

  // Добавляем обработчик для mainMenuBtn
  if (mainMenuBtn) {
    mainMenuBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // Initialize board pan and zoom
  if (board) {
    initBoardPanAndZoom(board);
  }

  // В функции bindUI:
  if (getBoardStateFunc() && getBoardStateFunc().notes && getBoardStateFunc().notes.length > 0) {
    console.log('initBoardUI (scripts.js): Rendering notes', getBoardStateFunc().notes.length);
    const fragment = document.createDocumentFragment();
    getBoardStateFunc().notes.forEach(note => {
      const restoredItem = restoreNoteFromState(note);
      const noteElement = addToBoard(restoredItem, note.type, note.id, note.pos, true, board, window.saveBoardToServer, redrawLinks, window.addNote, setBoardScale, dataSets);
      if (noteElement) {
        fragment.appendChild(noteElement);
      }
    });
    board.appendChild(fragment);
    
    // Initialize handlers after notes are rendered
    setTimeout(() => {
      const notes = board.querySelectorAll('.note');
      console.log('Initializing note handlers for', notes.length, 'notes');
      
      notes.forEach(note => {
        // Remove existing handlers
        const newNote = note.cloneNode(true);
        note.parentNode.replaceChild(newNote, note);
        
        // Add drag and resize handlers
        makeDraggable(newNote, board, linksLayer, redrawLinks, updateLinksLayerSize, getBoardScale, setNoteDragging);
        if (newNote.dataset.type === 'custom') {
          makeResizable(newNote, redrawLinks);
        }

        // Add editing handlers for custom notes
        if (newNote.dataset.type === 'custom') {
          const noteTitle = newNote.querySelector('.note-title');
          const noteBody = newNote.querySelector('.note-body');

          if (noteTitle) {
            noteTitle.contentEditable = 'false';
            noteTitle.addEventListener('click', (e) => {
              e.stopPropagation();
              if (noteTitle.contentEditable === 'true') return;
              noteTitle.contentEditable = 'true';
              noteTitle.focus();
              const range = document.createRange();
              range.selectNodeContents(noteTitle);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            });

            noteTitle.addEventListener('blur', async () => {
              noteTitle.contentEditable = 'false';
              noteTitle.classList.remove('editing');
              window.getSelection()?.removeAllRanges();
              const noteData = getBoardState()?.notes.find(n => n.id === newNote.id);
              if (noteData && noteData.custom) {
                noteData.custom.title = noteTitle.textContent || '';
                if (typeof window.saveBoardToServer === 'function') {
                  await window.saveBoardToServer();
                }
              }
            });

            noteTitle.addEventListener('keydown', async (event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                noteTitle.contentEditable = 'false';
                noteTitle.blur();
              }
            });
          }

          if (noteBody) {
            noteBody.contentEditable = 'false';
            noteBody.addEventListener('dblclick', (e) => {
              e.stopPropagation();
              noteBody.contentEditable = 'true';
              noteBody.focus();
              const range = document.createRange();
              range.selectNodeContents(noteBody);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            });

            noteBody.addEventListener('blur', async () => {
              noteBody.contentEditable = 'false';
              noteBody.classList.remove('editing');
              window.getSelection()?.removeAllRanges();
              const noteData = getBoardState()?.notes.find(n => n.id === newNote.id);
              if (noteData && noteData.custom) {
                noteData.custom.body = noteBody.textContent || '';
                if (typeof window.saveBoardToServer === 'function') {
                  await window.saveBoardToServer();
                }
              }
            });

            noteBody.addEventListener('keydown', async (event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                noteBody.contentEditable = 'false';
                noteBody.blur();
              }
            });
          }
        }

        // Add click handlers for non-custom notes
        if (newNote.dataset.type !== 'custom') {
          let wasDragged = false;
          newNote.addEventListener('mousedown', () => { wasDragged = false; });
          newNote.addEventListener('mousemove', () => { wasDragged = true; });
          newNote.addEventListener('mouseup', (e) => {
            if (wasDragged || e.target.closest('.delete-btn')) {
              wasDragged = false;
              return;
            }
            const noteData = getBoardState()?.notes.find(n => n.id === newNote.id);
            if (noteData && noteData.type !== 'custom') {
              let itemData = null;
              const ds = dataSets;
              // Для spells ищем только в spells
              if (noteData.type === 'spells' && ds && ds.spells) {
                itemData = ds.spells.find(item => item.id === noteData.itemId);
              } else if (noteData.type === 'items' && ds && (ds.items || ds.allItems)) {
                itemData = (ds.items || ds.allItems).find(item => item.id === noteData.itemId);
              } else if (noteData.type === 'artifacts' && ds && (ds.artifacts || ds.allArt)) {
                itemData = (ds.artifacts || ds.allArt).find(item => item.id === noteData.itemId);
              } else if (ds && noteData.type && ds[noteData.type]) {
                itemData = ds[noteData.type].find(item => item.id === noteData.itemId);
              }
              // Если не найдено — берем снапшот или noteData
              if (!itemData) itemData = noteData.itemSnapshot || noteData;
              if (!itemData || !itemData.name) {
                wasDragged = false;
                return;
              }
              showItemDetails(itemData, noteData.type, modal, modalHeader, modalContent);
            }
            wasDragged = false;
          });
        }
      });
      console.log('Note handlers initialized');
    }, 100);
    
    console.log('initBoardUI (scripts.js): Notes rendered');
  }

  // После рендера всех заметок назначить обработчик удаления на все заметки
  setTimeout(() => {
    document.querySelectorAll('.note').forEach(note => {
      const delBtn = note.querySelector('.delete-btn, .note-del-btn');
      if (delBtn) {
        delBtn.onclick = async (e) => {
          e.stopPropagation();
          note.remove();
          removeNote(note.id);
          if (typeof window.saveBoardToServer === 'function') {
            await window.saveBoardToServer();
          }
        };
      }
    });
    // Глобальный обработчик для сброса редактирования при клике вне любой заметки
    document.addEventListener('mousedown', (e) => {
      // Если клик по заметке или её потомкам — ничего не делаем
      if (e.target.closest('.note')) return;
      // Сбросить редактирование всех заголовков и тел заметок
      document.querySelectorAll('.note-title[contenteditable="true"], .note-body[contenteditable="true"]').forEach(async (el) => {
        el.contentEditable = 'false';
        el.classList.remove('editing');
        window.getSelection()?.removeAllRanges();
        // Сохраняем изменения, если это custom note
        const note = el.closest('.note');
        if (note) {
          const noteData = getBoardState()?.notes.find(n => n.id === note.id);
          if (noteData && noteData.custom) {
            if (el.classList.contains('note-title')) {
              noteData.custom.title = el.textContent || '';
            }
            if (el.classList.contains('note-body')) {
              noteData.custom.body = el.textContent || '';
            }
            if (typeof window.saveBoardToServer === 'function') {
              await window.saveBoardToServer();
            }
          }
        }
      });
    });
  }, 100);

  // Найти обработчик для resetZoomBtn и заменить его:
  // Вместо window.setBoardScale(1) использовать window.setBoardScale(1, undefined, undefined) — и не сбрасывать panX/panY.
  const resetZoomBtn = document.getElementById('resetZoomBtn');
  if (resetZoomBtn) {
    resetZoomBtn.onclick = () => {
      if (typeof window.setBoardScale === 'function') {
        // Сбросить только масштаб, не трогая pan
        window.setBoardScale(1);
      }
    };
  }
}

export { updateLinksLayerSize, getBoardScale, getPanX, getPanY, setBoardScale, setPan };

// === БОКОВАЯ ПАНЕЛЬ ПОИСКА ===
function createSearchSidebar() {
  // УДАЛЕНО: устаревшая реализация боковой панели поиска
}

// === КНОПКА ДЛЯ ОТКРЫТИЯ ПОИСКА ===
function addSearchSidebarButton() {
  // УДАЛЕНО: устаревшая реализация кнопки боковой панели поиска
}

// Вызвать при инициализации UI
// УДАЛЕНО: вызов addSearchSidebarButton();
