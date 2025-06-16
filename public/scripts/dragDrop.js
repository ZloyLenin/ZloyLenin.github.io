import { addConnection, removeConnection, updateNotePosition, getState as getBoardState } from './boardState.js';
import { startTempLink, updateTempLink, endTempLink } from './links.js';

let linkMode = false;

export function getLinkMode() {
  return linkMode;
}

export function setLinkMode(value) {
  linkMode = value;
  if (window.links?.setLinkMode) {
    window.links.setLinkMode(value);
  }
}

/**
 * Обработчик начала перетаскивания элемента
 * @param {DragEvent} e - событие dragstart
 * @param {Object} item - данные перетаскиваемого элемента
 */
export function handleDragStart(e, item) {
  if (linkMode) {
    e.dataTransfer.effectAllowed = 'none'; // Отключаем стандартное изображение перетаскивания
    e.preventDefault();
    return;
  }
  e.dataTransfer.setData('text/plain', JSON.stringify(item));
  e.dataTransfer.effectAllowed = 'move';
}

/**
 * Обработчик события dragover для доски
 * @param {DragEvent} e - событие dragover
 */
export function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

/**
 * Обработчик события drop на доске
 * @param {DragEvent} e - событие drop
 * @param {HTMLElement} board - элемент доски
 * @param {Function} addToBoard - функция добавления элемента на доску
 */
export function handleDrop(e, board, addToBoard) {
  e.preventDefault();
  const data = e.dataTransfer.getData('text/plain');
  if (!data) return;

  try {
    const item = JSON.parse(data);
    const boardRect = board.getBoundingClientRect();

    const left = e.clientX - boardRect.left - 80; // Центрируем элемент
    const top = e.clientY - boardRect.top - 40;

    addToBoard(item, item.noteType || item.type, null, {
      left: left,
      top: top,
      width: 250,
      height: 140
    });
  } catch (err) {
    // console.error('Drop error:', err); // REMOVE
  }
}

function getBoardRelativeCoords(e, linksLayer) {
  let clientX, clientY;
  if (e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  // Get the board container's position relative to the viewport
  const boardContainer = document.getElementById('board-container');
  if (!boardContainer) {
      // console.error('board-container not found!'); // REMOVE
      return { x: clientX, y: clientY }; // Fallback to viewport coords
  }
  const containerRect = boardContainer.getBoundingClientRect();

  // Coordinates relative to the board container (which is the linksLayer system)
  const x = clientX - containerRect.left;
  const y = clientY - containerRect.top;

  return { x, y };
}

/**
 * Получаем x/y из transform
 * @param {HTMLElement} el - элемент заметки
 * @returns {Object} - объект с x и y
 */
function getXYFromTransform(el) {
  const match = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(el.style.transform || '');
  if (match) return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
  return { x: 0, y: 0 };
}

/**
 * Делает элемент перетаскиваемым и поддерживает режим создания связей
 * @param {HTMLElement} el - элемент заметки
 * @param {HTMLElement} board - элемент доски
 * @param {HTMLElement} linksLayer - слой для отрисовки связей
 * @param {Function} redrawLinks - функция перерисовки связей
 * @param {Function} updateLinksLayerSize - функция обновления размеров слоя связей
 * @param {Function} getBoardScale - функция получения текущего масштаба доски
 */
export function makeDraggable(el, board, linksLayer, redrawLinks, updateLinksLayerSize, getBoardScale, setNoteDragging) {
  el.draggable = false;
  
  // Add copy button if it doesn't exist
  const header = el.querySelector('.note-header');
  if (header) {
    const controls = header.querySelector('.note-controls') || document.createElement('div');
    controls.className = 'note-controls';
    
    if (!header.querySelector('.note-copy-btn')) {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'note-copy-btn';
      copyBtn.title = 'Копировать содержимое';
      copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>`;
      copyBtn.onclick = (e) => {
        e.stopPropagation();
        const content = el.querySelector('.note-content') || el.querySelector('.note-body');
        if (content) {
          const text = content.innerText;
          navigator.clipboard.writeText(text).then(() => {
            // Visual feedback
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>`;
            setTimeout(() => {
              copyBtn.innerHTML = originalHTML;
            }, 1000);
          });
        }
      };
      controls.appendChild(copyBtn);
    }
    
    if (!header.contains(controls)) {
      header.appendChild(controls);
    }
  }
  
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  
  const onMouseDown = e => {
    if (typeof window.links?.getLinkMode === 'function' && window.links.getLinkMode()) {
      return;
    }
    // Проверяем, не происходит ли изменение размера
    if (e.target.classList.contains('resize-handle')) return;
    
    // В режиме связи не позволяем перетаскивать
    if (linkMode) {
      console.log('Note drag prevented: link mode active');
      return;
    }
    
    // Проверяем, не редактируется ли заметка
    const editableElements = el.querySelectorAll('[contenteditable="true"]');
    if (Array.from(editableElements).some(elem => elem.contains(e.target))) {
      console.log('Note drag prevented: note is being edited');
      return;
    }
    
    // Не начинаем перетаскивание для кнопки удаления
    if (e.target.closest('.delete-btn') || e.target.closest('.note-del-btn')) {
      console.log('Note drag prevented: delete button clicked');
      return;
    }
    
    // Только левая кнопка мыши
    if (e.button !== 0) {
      console.log('Note drag prevented: not left mouse button');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    isDragging = true;
    if (typeof setNoteDragging === 'function') {
      setNoteDragging(true);
    }
    
    startX = e.clientX;
    startY = e.clientY;
    
    const transform = el.style.transform;
    const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
    if (match) {
      startLeft = parseFloat(match[1]);
      startTop = parseFloat(match[2]);
    } else {
      startLeft = 0;
      startTop = 0;
    }
    
    el.classList.add('dragging');
    el.style.zIndex = '1000';
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    console.log('Note drag started', { startX, startY, startLeft, startTop });
  };
  
  const onMouseMove = e => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const scale = typeof getBoardScale === 'function' ? getBoardScale() : 1;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;
    
    el.style.transform = `translate(${startLeft + dx}px, ${startTop + dy}px)`;
    
    if (typeof updateLinksLayerSize === 'function') {
      updateLinksLayerSize();
    }
    if (typeof redrawLinks === 'function') {
      redrawLinks();
    }
  };
  
  const onMouseUp = e => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    isDragging = false;
    if (typeof setNoteDragging === 'function') {
      setNoteDragging(false);
    }
    
    el.classList.remove('dragging');
    el.style.zIndex = '';
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    // Update note position in state
    const transform = el.style.transform;
    const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
    if (match) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      if (typeof window.updateNotePosition === 'function') {
        window.updateNotePosition(el.id, { x, y });
      }
    }
    
    console.log('Note drag ended');
  };
  
  // Remove any existing handlers before adding new ones
  el.removeEventListener('mousedown', onMouseDown);
  el.addEventListener('mousedown', onMouseDown);
  
  // Добавляем обработчик для режима связи
  if (linkMode) {
    el.classList.add('link-mode');
  } else {
    el.classList.remove('link-mode');
  }
  
  console.log('Draggable handlers applied to note', { id: el.id, linkMode });
}

/**
 * Делает элемент изменяемым по размеру
 * @param {HTMLElement} note - элемент заметки
 * @param {Function} redrawLinks - функция перерисовки связей
 */
export function makeResizable(note, redrawLinks) {
  const minWidth = 250;
  const minHeight = 140;
  const maxWidth = 800;
  const maxHeight = 600;

  let currentResizeDir = null;
  let startX, startY, startWidth, startHeight, startLeft, startTop;
  let isResizing = false;
  let resizeScale = 1; // глобальная переменная для фиксации масштаба на время ресайза
  let resizePanX = 0, resizePanY = 0; // фиксируем panX/panY board-а на время ресайза

  const directions = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];

  directions.forEach(dir => {
    const handle = document.createElement('div');
    handle.className = `resize-handle resize-${dir}`;
    const size = 8;
    handle.style.position = 'absolute';
    handle.style.userSelect = 'none';
    handle.style.zIndex = '10';

    // Совпадаем с CSS (note.css/styles.css)
    switch (dir) {
      case 'n':
        handle.style.top = '-4px';
        handle.style.left = '0';
        handle.style.right = '0';
        handle.style.height = `${size}px`;
        handle.style.width = '100%';
        handle.style.cursor = 'n-resize';
        break;
      case 's':
        handle.style.bottom = '-4px';
        handle.style.left = '0';
        handle.style.right = '0';
        handle.style.height = `${size}px`;
        handle.style.width = '100%';
        handle.style.cursor = 's-resize';
        break;
      case 'e':
        handle.style.top = '0';
        handle.style.right = '-4px';
        handle.style.bottom = '0';
        handle.style.width = `${size}px`;
        handle.style.height = '100%';
        handle.style.cursor = 'e-resize';
        break;
      case 'w':
        handle.style.top = '0';
        handle.style.left = '-4px';
        handle.style.bottom = '0';
        handle.style.width = `${size}px`;
        handle.style.height = '100%';
        handle.style.cursor = 'w-resize';
        break;
      case 'ne':
        handle.style.top = '-4px';
        handle.style.right = '-4px';
        handle.style.width = `${size}px`;
        handle.style.height = `${size}px`;
        handle.style.cursor = 'ne-resize';
        break;
      case 'nw':
        handle.style.top = '-4px';
        handle.style.left = '-4px';
        handle.style.width = `${size}px`;
        handle.style.height = `${size}px`;
        handle.style.cursor = 'nw-resize';
        break;
      case 'se':
        handle.style.bottom = '-4px';
        handle.style.right = '-4px';
        handle.style.width = `${size}px`;
        handle.style.height = `${size}px`;
        handle.style.cursor = 'se-resize';
        break;
      case 'sw':
        handle.style.bottom = '-4px';
        handle.style.left = '-4px';
        handle.style.width = `${size}px`;
        handle.style.height = `${size}px`;
        handle.style.cursor = 'sw-resize';
        break;
    }

    note.appendChild(handle);

    const startResize = e => {
      e.preventDefault();
      isResizing = true;
      currentResizeDir = dir;
      const board = document.getElementById('board');
      // --- Фиксируем scale и panX/panY ---
      let scale = 1;
      let panX = 0, panY = 0;
      if (board) {
        const computedStyle = window.getComputedStyle(board);
        const transform = computedStyle.transform;
        if (transform && transform !== 'none') {
          const match = transform.match(/matrix\(([^)]+)\)/);
          if (match) {
            const values = match[1].split(', ');
            const a = parseFloat(values[0]);
            const b = parseFloat(values[1]);
            scale = Math.sqrt(a * a + b * b);
            panX = parseFloat(values[4]);
            panY = parseFloat(values[5]);
          }
        }
      }
      if (!scale || isNaN(scale)) scale = 1;
      if (!panX || isNaN(panX)) panX = 0;
      if (!panY || isNaN(panY)) panY = 0;
      resizeScale = scale;
      resizePanX = panX;
      resizePanY = panY;

      // --- Координаты мыши и заметки в системе board ---
      const boardRect = board.getBoundingClientRect();
      // Вместо вычислений через getBoundingClientRect:
      const { x: left, y: top } = getXYFromTransform(note);
      const eventClientX = e.clientX || (e.touches && e.touches[0].clientX);
      const eventClientY = e.clientY || (e.touches && e.touches[0].clientY);
      let startX = (eventClientX - boardRect.left - panX) / scale;
      let startY = (eventClientY - boardRect.top - panY) / scale;
      // Сохраняем в note
      note._resizeStartX = startX;
      note._resizeStartY = startY;
      note._resizeStartLeft = left;
      note._resizeStartTop = top;
      note._resizeStartScale = scale;
      note._resizeStartPanX = panX;
      note._resizeStartPanY = panY;

      startWidth = parseFloat(note.style.width) || note.offsetWidth;
      startHeight = parseFloat(note.style.height) || note.offsetHeight;

      note.dataset.isResizing = 'true';

      document.addEventListener('mousemove', doResize);
      document.addEventListener('touchmove', doResize, { passive: false });
      document.addEventListener('mouseup', stopResize);
      document.addEventListener('touchend', stopResize);
      document.addEventListener('touchcancel', stopResize);
    };

    handle.addEventListener('mousedown', startResize);
    handle.addEventListener('touchstart', startResize, { passive: false });
  });

  function doResize(e) {
    if (!isResizing) return;
    e.preventDefault();
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    // scale и panX/panY фиксированы при старте
    const scale = note._resizeStartScale;
    const panX = note._resizeStartPanX;
    const panY = note._resizeStartPanY;
    let realPanX = panX / scale;
    let realPanY = panY / scale;
    // Координаты мыши относительно board
    let clientX = e.clientX || (e.touches && e.touches[0].clientX);
    let clientY = e.clientY || (e.touches && e.touches[0].clientY);
    let adjustedClientX = (clientX - boardRect.left - panX) / scale;
    let adjustedClientY = (clientY - boardRect.top - panY) / scale;
    // Стартовые значения
    const startX = note._resizeStartX;
    const startY = note._resizeStartY;
    const startLeft = note._resizeStartLeft;
    const startTop = note._resizeStartTop;

    let dx = adjustedClientX - startX;
    let dy = adjustedClientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    if (currentResizeDir.includes('e')) {
      newWidth = Math.min(Math.max(startWidth + dx, minWidth), maxWidth);
    }
    if (currentResizeDir.includes('s')) {
      newHeight = Math.min(Math.max(startHeight + dy, minHeight), maxHeight);
    }
    if (currentResizeDir.includes('w')) {
      const rawWidth = startWidth - dx;
      const clampedWidth = Math.min(Math.max(rawWidth, minWidth), maxWidth);
      const actualDx = startWidth - clampedWidth;
      newLeft = startLeft + actualDx;
      newWidth = clampedWidth;
    }
    if (currentResizeDir.includes('n')) {
      const rawHeight = startHeight - dy;
      const clampedHeight = Math.min(Math.max(rawHeight, minHeight), maxHeight);
      const actualDy = startHeight - clampedHeight;
      newTop = startTop + actualDy;
      newHeight = clampedHeight;
    }

    note.style.transform = `translate(${newLeft}px, ${newTop}px)`;
    note.style.width = `${newWidth}px`;
    note.style.height = `${newHeight}px`;

    if (typeof updateLinksLayerSize === 'function') updateLinksLayerSize();
    if (typeof redrawLinks === 'function') redrawLinks();
  }

  function stopResize() {
    if (isResizing) {
        isResizing = false;
        note.dataset.isResizing = 'false';
        
        // Сохраняем актуальные размеры заметки
        const width = parseFloat(note.style.width);
        const height = parseFloat(note.style.height);
        const { x, y } = getXYFromTransform(note);
        
        if (typeof window.updateNotePosition === 'function') {
            window.updateNotePosition(note.id, {
                x,
                y,
                width,
                height
            });
        }
        
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('touchmove', doResize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchcancel', stopResize);
    }
  }
}

export { linkMode };
