import { sourceMapping } from './dataNormalization.js';

// Универсальная функция для компактных карточек поиска и доски
window.createCompactCard = function createCompactCard(item, type, sizeClass, showDelete = true) {
  // Универсальный цвет для параметров
  const paramClass = 'card-param';
  // Универсальный блок параметров
  function paramsBlock(params) {
    return `<div class="card-params-row">${params.map(p => `<span class='card-param short-param'>${p}</span>`).join('')}</div>`;
  }
  function extraBlock(extra) {
    return extra ? `<div class="card-extra">${extra}</div>` : '';
  }
  function sourceBlock(source, sourceFull) {
    if (!source) return '';
    // Получаем расшифровку из sourceMapping, если не передано явно
    let full = sourceFull;
    if (!full || full === 'Неизвестный источник') {
      full = sourceMapping[source] || 'Неизвестный источник';
    }
    return `<span class="source-badge source-tooltip" title="${full}">${source}</span>`;
  }
  const sizeClassStr = sizeClass ? ` ${sizeClass}` : '';
  if (type === 'spells') {
    // Гарантируем, что компоненты всегда массив строк, без пустых
    let componentsArr = [];
    if (Array.isArray(item.components)) {
      componentsArr = item.components.filter(Boolean).map(c => c.trim()).filter(Boolean);
    } else if (typeof item.components === 'string') {
      componentsArr = item.components.split(/,\s*/).map(c => c.trim()).filter(Boolean);
    }
    // Компоненты компактно, с tooltip
    const components = (componentsArr.length)
      ? `<div class="spell-components-compact-row">${componentsArr.map(c => {
          const tooltip = getComponentTooltipShort(c);
          return `<span class='spell-component-compact${tooltip ? " with-tooltip" : ""}'${tooltip ? ` title='${tooltip}'` : ''}>${c}</span>`;
        }).join('')}</div>`
      : '';
    const params = [
      item.level > 0 ? `${item.level} уровень` : 'Заговор',
      item.school ? `<span class="spell-school-fixed">${item.school}</span>` : null
    ].filter(Boolean);
    const extra = item.source ? `Источник: ${item.source}` : '';
    return `
      <div class="search-card search-card-spell${sizeClassStr}">
        <div class="search-card-title"><span>${item.name}</span>${showDelete ? '<button class="delete-btn" title="Удалить" tabindex="-1">✖</button>' : ''}</div>
        <div class="search-card-content">
          <div class="search-card-meta">${params.map(p => typeof p === 'string' ? p : p.join('')).join(' ')}</div>
          ${components}
        </div>
        <div class="search-card-footer card-footer-flex">${sourceBlock(item.source, item.sourceFull)}</div>
      </div>
    `;
  }
  if (type === 'artifacts') {
    let itemType = item.typeRu || '';
    if (!itemType && item.type && typeof oTypes === 'object' && oTypes[item.type.toLowerCase()]) {
      itemType = oTypes[item.type.toLowerCase()].text?.ru?.title || item.type;
    }
    if (!itemType && item.type) itemType = item.type;
    if (!itemType) itemType = 'Неизвестный тип';
    // Тип на первой строке, редкость — на второй
    const params = [
      itemType ? `<span class="artifact-type">${itemType}</span>` : null,
      item.rarity ? `<span class="artifact-rarity">${item.rarity}</span>` : null
    ].filter(Boolean);
    const extra = item.source ? `Источник: ${item.source}` : '';
    return `
      <div class="search-card search-card-item${sizeClassStr}">
        <div class="search-card-title"><span>${item.name}</span>${showDelete ? '<button class="delete-btn" title="Удалить" tabindex="-1">✖</button>' : ''}</div>
        <div class="search-card-content">
          <div class="search-card-meta" style="display: flex; flex-direction: column; gap: 2px;">
            ${params[0] || ''}
            ${params[1] || ''}
          </div>
        </div>
        <div class="search-card-footer card-footer-flex">${sourceBlock(item.source, item.sourceFull)}</div>
      </div>
    `;
  }
  if (type === 'items') {
    // Используем только item.typeRu для отображения типа
    const itemType = item.typeRu || 'Неизвестный тип';
    // Форматируем стоимость с учетом нового формата
    let coastDisplay = '';
    if (item.coast) {
      if (typeof item.coast === 'object' && item.coast.display) {
        coastDisplay = `<span class="currency-tooltip" title="${item.coast.tooltip}">${item.coast.display}</span>`;
      } else {
        coastDisplay = item.coast;
      }
    }
    const params = [
      itemType,
      coastDisplay || null,
      item.weight ? `${item.weight} фнт.` : null
    ].filter(Boolean);
    const extra = item.source ? `Источник: ${item.source}` : '';
    return `
      <div class="search-card search-card-item${sizeClassStr}">
        <div class="search-card-title"><span>${item.name}</span>${showDelete ? '<button class="delete-btn" title="Удалить" tabindex="-1">✖</button>' : ''}</div>
        <div class="search-card-content">
          <div class="search-card-meta">${params.map(p => typeof p === 'string' ? p : p).join(' ')}</div>
        </div>
        <div class="search-card-footer card-footer-flex">${sourceBlock(item.source, item.sourceFull)}</div>
      </div>
    `;
  }
  if (type === 'monsters') {
    // Корректно выводим тип существа
    let monsterType = item.typeRu || item.type;
    if (monsterType === 'monsters' && item.originalType) {
      monsterType = item.originalType;
    }
    // Английское имя в скобках, если оно есть и отличается от русского
    let enName = '';
    if (item.originalName && item.originalName !== item.name) {
      enName = `<span class="monster-en-name">(${item.originalName})</span>`;
    }
    // Разделяем параметры точками для читаемости
    const params = [monsterType, item.size].filter(Boolean).join(' • ');
    // Бейдж уровня опасности: только цифра, с data-cr-tooltip
    const crBadge = item.cr ? `<span class=\"meta-label badge-cr-natural\" data-cr-tooltip=\"уровень опасности\">${item.cr}</span>` : '';
    return `
      <div class="search-card search-card-monster${sizeClassStr}">
        <div class="search-card-title"><span>${item.name}</span>${enName}${showDelete ? '<button class="delete-btn" title="Удалить" tabindex="-1">✖</button>' : ''}</div>
        <div class="search-card-content">
          <div class="search-card-meta">${params}</div>
        </div>
        <div class="search-card-footer card-footer-between">${crBadge}<span style="flex:1 1 auto"></span>${sourceBlock(item.source, item.sourceFull)}</div>
      </div>
    `;
  }
  return '';
}

// Добавить функцию getComponentTooltip
function getComponentTooltip(c) {
  switch (c) {
    case 'В': return 'Вербальный компонент — произнесение слов';
    case 'С': return 'Соматический компонент — жесты руками';
    case 'М': return 'Материальный компонент — требуется предмет';
    default: return '';
  }
}

// Добавить функцию getComponentTooltipShort
function getComponentTooltipShort(c) {
  if (typeof c === 'string') {
    const trimmed = c.trim();
    // Если строго 'М' (без скобок) или начинается с 'М'
    if (trimmed.toUpperCase() === 'М' || trimmed.toUpperCase().startsWith('М')) {
      return 'Материальный: требуется предмет';
    }
  }
  switch (c) {
    case 'В': return 'Вербальный: произнесение слов';
    case 'С': return 'Соматический: жесты руками';
    case 'М': return 'Материальный: требуется предмет';
    default: return '';
  }
}

// После экспорта функции
window.bindSpellComponentTooltips = function bindSpellComponentTooltips() {
  // Снимаем старые обработчики
  document.querySelectorAll('.spell-component-compact').forEach(el => {
    el.removeEventListener('mouseenter', el._tooltipEnter);
    el.removeEventListener('mouseleave', el._tooltipLeave);
    el.removeEventListener('mousemove', el._tooltipMove);
  });
  document.querySelectorAll('.spell-component-compact.with-tooltip').forEach(el => {
    const showTooltip = (e) => {
      const text = el.getAttribute('title');
      if (!text) return;
      el._tooltipDiv = document.createElement('div');
      el._tooltipDiv.className = 'js-tooltip';
      el._tooltipDiv.innerText = text;
      document.body.appendChild(el._tooltipDiv);
      el.removeAttribute('title');
      positionTooltip(e, el._tooltipDiv);
    };
    const hideTooltip = () => {
      if (el._tooltipDiv) {
        document.body.removeChild(el._tooltipDiv);
        el._tooltipDiv = null;
      }
      // Восстанавливаем title для SEO/доступности
      if (el.dataset.tooltipText) {
        el.setAttribute('title', el.dataset.tooltipText);
      }
    };
    const moveTooltip = (e) => {
      if (el._tooltipDiv) positionTooltip(e, el._tooltipDiv);
    };
    el._tooltipEnter = showTooltip;
    el._tooltipLeave = hideTooltip;
    el._tooltipMove = moveTooltip;
    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('mousemove', moveTooltip);
    // Сохраняем текст для восстановления
    if (!el.dataset.tooltipText) el.dataset.tooltipText = el.getAttribute('title');
  });
}
function positionTooltip(e, tooltipDiv) {
  const offsetX = 15; // Смещение вправо от курсора
  const offsetY = 15; // Смещение вниз от курсора
  const padding = 8; // Отступ от краев окна

  const rect = tooltipDiv.getBoundingClientRect();
  let left = e.clientX + offsetX;
  let top = e.clientY + offsetY;

  // Не вылезать за правый край окна
  if (left + rect.width > window.innerWidth - padding) {
    left = window.innerWidth - rect.width - padding;
  }

  // Не вылезать за нижний край окна. Если вылезает, размещаем над курсором
  if (top + rect.height > window.innerHeight - padding) {
    top = e.clientY - rect.height - offsetY;
    // Если и так вылезает за верхний край (маловероятно для всплывашек), просто прижимаем к верхнему отступу
    if (top < padding) {
        top = padding;
    }
  }

  // Не вылезать за левый край окна (если смещено слишком вправо изначально)
  if (left < padding) {
      left = padding;
  }

  tooltipDiv.style.position = 'fixed';
  tooltipDiv.style.left = left + 'px';
  tooltipDiv.style.top = top + 'px';
  tooltipDiv.style.zIndex = 99999;
  tooltipDiv.style.background = 'var(--surface-raised)';
  tooltipDiv.style.color = 'var(--text-primary)';
  tooltipDiv.style.border = '1px solid var(--border)';
  tooltipDiv.style.borderRadius = '6px';
  tooltipDiv.style.padding = '6px 12px';
  tooltipDiv.style.fontSize = '0.95em';
  tooltipDiv.style.whiteSpace = 'pre-line';
  tooltipDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
  tooltipDiv.style.pointerEvents = 'none';
  tooltipDiv.style.opacity = '1';
  tooltipDiv.style.maxWidth = '350px';
  tooltipDiv.style.minWidth = '120px';
}

// Удалить вставку icon из createBoardNoteCard
// Вместо отдельной разметки для доски — возвращать результат createCompactCard(item, type, 'board-size')
window.createBoardNoteCard = function createBoardNoteCard(item, type) {
  return window.createCompactCard(item, type, 'board-size', true);
}

// После создания карточки (note-card/search-card), добавить обработчик:
setTimeout(() => {
  document.querySelectorAll('.note-del-btn, .delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
    }, true);
  });
}, 0); 