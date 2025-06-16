// Убираем импорт из uiHandlers.js, чтобы избежать циклической зависимости
// import { getBoardScale, getPanX, getPanY } from './uiHandlers.js';
import { addConnection, removeConnection, getState as getBoardState } from './boardState.js';

let tempLine = null;
let linksLayer = null;
let linkMode = false;
let linkStartNote = null;

// Получаем значения масштаба и смещения напрямую из DOM
function getBoardTransform() {
  const board = document.getElementById('board');
  if (!board) return { scale: 1, panX: 0, panY: 0 };
  
  const transform = board.style.transform;
  const scaleMatch = transform.match(/scale\(([-\d.]+)\)/);
  const translateMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
  
  return {
    scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
    panX: translateMatch ? parseFloat(translateMatch[1]) : 0,
    panY: translateMatch ? parseFloat(translateMatch[2]) : 0
  };
}

// Простые геттеры/сеттеры для режима связей
function getLinkMode() {
  return linkMode;
}

function setLinkMode(value) {
  console.log('Links.js: Setting link mode to:', value);
  linkMode = value;
  
  // Очищаем временную линию
  if (tempLine && tempLine.parentNode) {
    tempLine.parentNode.removeChild(tempLine);
    tempLine = null;
  }
  
  // Сбрасываем состояние
  linkStartNote = null;
  
  // Очищаем все обработчики
  document.querySelectorAll('.note').forEach(note => {
    note.classList.toggle('link-mode', value);
    note.removeEventListener('mousedown', handleNoteLinkStart);
    if (value) {
      note.addEventListener('mousedown', handleNoteLinkStart);
    }
  });
}

// Простая функция для создания SVG линии
function createSVGLine() {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('stroke', '#7f5af0');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('fill', 'none');
  line.style.pointerEvents = 'stroke';
  return line;
}

// Получаем центр элемента относительно SVG
function getElementCenter(element, svg) {
  const rect = element.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  
  return {
    x: rect.left + rect.width / 2 - svgRect.left,
    y: rect.top + rect.height / 2 - svgRect.top
  };
}

function getBoardRelativeCoords(e) {
  let clientX, clientY;
  if (e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const boardContainer = document.getElementById('board-container');
  if (!boardContainer) {
    return { x: clientX, y: clientY };
  }

  const containerRect = boardContainer.getBoundingClientRect();
  const { scale, panX, panY } = getBoardTransform();

  // Координаты относительно контейнера доски
  const x = (clientX - containerRect.left - panX) / scale;
  const y = (clientY - containerRect.top - panY) / scale;

  return { x, y };
}

function getNoteRect(note, linksLayer) {
  const noteRect = note.getBoundingClientRect();
  const boardContainer = document.getElementById('board-container');
  if (!boardContainer) {
    console.error('board-container not found in getNoteRect!');
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  const containerRect = boardContainer.getBoundingClientRect();
  const { scale, panX, panY } = getBoardTransform();
  
  // Get coordinates from note's transform
  const transform = note.style.transform;
  const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
  const x = match ? parseFloat(match[1]) : 0;
  const y = match ? parseFloat(match[2]) : 0;
  
  // Use actual note dimensions
  const width = noteRect.width / scale;
  const height = noteRect.height / scale;
  
  return {
    x,
    y,
    width,
    height,
    left: x,
    top: y,
    right: x + width,
    bottom: y + height
  };
}

function getCenter(rect) {
  return {
    x: (rect.left + rect.right) / 2,
    y: (rect.top + rect.bottom) / 2
  };
}

function getLineRectIntersection(rect, x1, y1, x2, y2) {
  // Находит точку пересечения прямой (x1,y1)-(x2,y2) с границей rect
  // Возвращает {x, y} или null если нет пересечения
  const sides = [
    // Левая
    { x1: rect.left, y1: rect.top, x2: rect.left, y2: rect.bottom },
    // Правая
    { x1: rect.right, y1: rect.top, x2: rect.right, y2: rect.bottom },
    // Верхняя
    { x1: rect.left, y1: rect.top, x2: rect.right, y2: rect.top },
    // Нижняя
    { x1: rect.left, y1: rect.bottom, x2: rect.right, y2: rect.bottom }
  ];
  for (const side of sides) {
    const pt = getLineIntersection(x1, y1, x2, y2, side.x1, side.y1, side.x2, side.y2);
    if (pt &&
      pt.x >= Math.min(side.x1, side.x2) - 0.1 && pt.x <= Math.max(side.x1, side.x2) + 0.1 &&
      pt.y >= Math.min(side.y1, side.y2) - 0.1 && pt.y <= Math.max(side.y1, side.y2) + 0.1
    ) {
      return pt;
    }
  }
  return null;
}

function getLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  // Пересечение двух отрезков
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (denom === 0) return null;
  const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
  const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;
  // Проверяем, что точка лежит на обоих отрезках
  if (
    (px < Math.min(x1, x2) - 0.1 || px > Math.max(x1, x2) + 0.1) ||
    (px < Math.min(x3, x4) - 0.1 || px > Math.max(x3, x4) + 0.1) ||
    (py < Math.min(y1, y2) - 0.1 || py > Math.max(y1, y2) + 0.1) ||
    (py < Math.min(y3, y4) - 0.1 || py > Math.max(y3, y4) + 0.1)
  ) {
    return null;
  }
  return { x: px, y: py };
}

function getNearestPointOnRect(rect, x, y) {
  // Находит ближайшую к (x, y) точку на границе rect
  let px = Math.max(rect.left, Math.min(x, rect.right));
  let py = Math.max(rect.top, Math.min(y, rect.bottom));
  // Теперь "прижимаем" к ближайшей стороне
  const dLeft = Math.abs(px - rect.left);
  const dRight = Math.abs(px - rect.right);
  const dTop = Math.abs(py - rect.top);
  const dBottom = Math.abs(py - rect.bottom);
  const minDist = Math.min(dLeft, dRight, dTop, dBottom);
  if (minDist === dLeft) px = rect.left;
  else if (minDist === dRight) px = rect.right;
  if (minDist === dTop) py = rect.top;
  else if (minDist === dBottom) py = rect.bottom;
  return { x: px, y: py };
}

function adjustIfCorner(pt, rect, offset = 2) {
  // Проверяем, совпадает ли точка с каким-либо углом
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height }
  ];
  
  for (const corner of corners) {
    if (Math.abs(pt.x - corner.x) < 0.5 && Math.abs(pt.y - corner.y) < 0.5) {
      // Смещаем вдоль стороны (выбираем направление по ситуации)
      if (corner.x === rect.x) pt.x += offset;
      else pt.x -= offset;
      if (corner.y === rect.y) pt.y += offset;
      else pt.y -= offset;
      break;
    }
  }
  return pt;
}

function getEdgePointSmart(rect, targetX, targetY) {
  // Center of the rectangle
  const center = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };

  // Find intersection with the nearest side
  const sides = [
    // Left
    { x1: rect.x, y1: rect.y, x2: rect.x, y2: rect.y + rect.height },
    // Right
    { x1: rect.x + rect.width, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height },
    // Top
    { x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y },
    // Bottom
    { x1: rect.x, y1: rect.y + rect.height, x2: rect.x + rect.width, y2: rect.y + rect.height }
  ];

  let minDist = Infinity;
  let bestPoint = null;

  for (const side of sides) {
    const pt = getLineIntersection(center.x, center.y, targetX, targetY, side.x1, side.y1, side.x2, side.y2);
    if (pt) {
      const dist = Math.hypot(pt.x - center.x, pt.y - center.y);
      if (dist < minDist) {
        minDist = dist;
        bestPoint = pt;
      }
    }
  }

  // If no intersection found, use nearest point on rectangle
  if (!bestPoint) {
    bestPoint = getNearestPointOnRect(rect, targetX, targetY);
  }

  // Adjust if point is at a corner
  bestPoint = adjustIfCorner(bestPoint, rect);

  return bestPoint;
}

function getAsideRightEdge() {
  const aside = document.querySelector('aside');
  if (aside) {
    const rect = aside.getBoundingClientRect();
    const boardContainer = document.getElementById('board-container');
    if (boardContainer) {
      const boardRect = boardContainer.getBoundingClientRect();
      // Возвращаем правый край aside относительно board-container
      return rect.right - boardRect.left; // убран +12
    }
    return rect.right;
  }
  return 240; // fallback: ширина aside
}

function clipToBoardArea(pt) {
  // Remove left side clipping
  return { x: pt.x, y: pt.y };
}

function redrawLinks() {
  const linksLayer = document.getElementById('linksLayer');
  if (!linksLayer) return;

  // Очищаем слой
  while (linksLayer.firstChild) {
    linksLayer.removeChild(linksLayer.firstChild);
  }

  // Получаем текущие связи
  const state = getBoardState();
  if (!state || !state.connections) return;

  // Перерисовываем каждую связь
  state.connections.forEach(connection => {
    const fromNote = document.getElementById(connection.from);
    const toNote = document.getElementById(connection.to);
    if (!fromNote || !toNote) return;

    const fromRect = getNoteRect(fromNote, linksLayer);
    const toRect = getNoteRect(toNote, linksLayer);
    
    // Находим центры заметок
    const fromCenter = {
      x: fromRect.x + fromRect.width / 2,
      y: fromRect.y + fromRect.height / 2
    };
    const toCenter = {
      x: toRect.x + toRect.width / 2,
      y: toRect.y + toRect.height / 2
    };

    // Находим точки на краях заметок
    const fromPoint = getEdgePointSmart(fromRect, toCenter.x, toCenter.y);
    const toPoint = getEdgePointSmart(toRect, fromCenter.x, fromCenter.y);

    // Создаем линию
    const line = createSVGLine();
    line.setAttribute('d', `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`);
    line.dataset.from = connection.from;
    line.dataset.to = connection.to;
    line.addEventListener('click', handleLinkClick);
    linksLayer.appendChild(line);
  });
}

// Добавляем обработчик изменения размера для всех заметок
function addResizeObservers() {
  document.querySelectorAll('.note').forEach(note => {
    const observer = new ResizeObserver(() => {
      redrawLinks();
    });
    observer.observe(note);
  });
}

// Экспортируем функцию для использования в других модулях
function initLinksSystem() {
  // Инициализация системы связей
  const linksLayer = document.getElementById('linksLayer');
  if (!linksLayer) {
    console.error('Links layer not found!');
    return;
  }

  // Добавляем обработчики изменения размера
  addResizeObservers();
}

// Экспортируем handleNoteLinkMove под старым именем для обратной совместимости
const handleNoteLinkUpdate = handleNoteLinkMove;

// Экспортируем все функции, которые нужно сделать публичными
export {
  handleNoteLinkStart,
  handleNoteLinkMove,
  handleNoteLinkEnd,
  redrawLinks,
  initLinksSystem,
  getLinkMode,
  setLinkMode,
  startTempLink,
  updateTempLink,
  endTempLink,
  handleLinkClick,
  handleNoteLinkUpdate
};

// Добавляем функции для обратной совместимости с dragDrop.js
function startTempLink(noteId) {
  if (window.links?.setLinkMode) {
    window.links.setLinkMode(true);
  }
}

function updateTempLink(x, y) {
  // Эта функциональность теперь обрабатывается через handleNoteLinkMove
  // Оставлено для обратной совместимости
}

function endTempLink() {
  if (window.links?.setLinkMode) {
    window.links.setLinkMode(false);
  }
}

// Глобальный доступ к функциям
window.links = {
  redrawLinks,
  setLinkMode,
  getLinkMode
};

// Для обратной совместимости
window.initLinksSystem = initLinksSystem;

function handleNoteLinkStart(e) {
  if (!getLinkMode()) return;
  e.preventDefault();
  e.stopPropagation();
  linkStartNote = e.currentTarget;
  linksLayer = document.getElementById('linksLayer');
  if (!linksLayer) {
    console.error('Links layer not found!');
    return;
  }
  tempLine = createSVGLine();
  tempLine.classList.add('temp-link');
  tempLine.dataset.from = linkStartNote.id;
  linksLayer.appendChild(tempLine);
  // Получаем начальную позицию от границы заметки
  const noteRect = getNoteRect(linkStartNote, linksLayer);
  const mousePos = getBoardRelativeCoords(e);
  const startPos = getEdgePointSmart(noteRect, mousePos.x, mousePos.y);
  tempLine.dataset.startX = startPos.x;
  tempLine.dataset.startY = startPos.y;
  const d = `M ${startPos.x} ${startPos.y} L ${mousePos.x} ${mousePos.y}`;
  tempLine.setAttribute('d', d);
  document.addEventListener('mousemove', handleNoteLinkMove);
  document.addEventListener('mouseup', handleNoteLinkEnd);
}

function handleNoteLinkMove(e) {
  if (!tempLine || !linkStartNote || !linksLayer) return;
  e.preventDefault();
  const mousePos = getBoardRelativeCoords(e);
  const startX = parseFloat(tempLine.dataset.startX);
  const startY = parseFloat(tempLine.dataset.startY);
  const d = `M ${startX} ${startY} L ${mousePos.x} ${mousePos.y}`;
  tempLine.setAttribute('d', d);
}

function handleNoteLinkEnd(e) {
  if (!tempLine || !linkStartNote || !linksLayer) return;
  
  // Получаем координаты мыши относительно доски
  const mousePos = getBoardRelativeCoords(e);
  
  // Находим заметку под курсором
  const targetNote = document.elementFromPoint(e.clientX, e.clientY)?.closest('.note');
  
  if (targetNote && targetNote !== linkStartNote) {
    // Создаем постоянную связь
    addConnection({ from: linkStartNote.id, to: targetNote.id });
    redrawLinks();
  }
  
  // Очищаем
  if (tempLine.parentNode) {
    tempLine.parentNode.removeChild(tempLine);
  }
  tempLine = null;
  linkStartNote = null;
  
  // Удаляем обработчики
  document.removeEventListener('mousemove', handleNoteLinkMove);
  document.removeEventListener('mouseup', handleNoteLinkEnd);
}

function handleLinkClick(e) {
  const line = e.target;
  const from = line.dataset.from;
  const to = line.dataset.to;
  // Получаем state через getBoardState()
  const state = typeof getBoardState === 'function' ? getBoardState() : window.state;
  if (state && state.connections) {
    state.connections = state.connections.filter(c => !(c.from === from && c.to === to));
    if (typeof window.saveBoardToServer === 'function') window.saveBoardToServer();
    redrawLinks();
  }
}
