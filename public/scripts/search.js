import { db } from './database.js';
import { normalizeSpells, normalizeMonsters, normalizeArtifacts, normalizeItems } from './dataNormalization.js';
import './compactCard.js';

// Константы
const RESULTS_PER_PAGE = 50;
const SEARCH_DELAY = 300; // мс

// Состояние
let state = {
  currentType: 'all',
  searchQuery: '',
  filters: {},
  results: [],
  fullResults: [],
  page: 1,
  hasMore: true,
  searchTimeout: null,
  isLoading: false
};

// DOM элементы
let elements = {};

// Инициализация
async function initSearch() {
  // Инициализация DOM элементов
  elements = {
    sidebar: document.getElementById('search-sidebar'),
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    closeSidebar: document.getElementById('closeSearchSidebar'),
    tabs: document.querySelectorAll('.search-tab'),
    showFilters: document.getElementById('showFilters'),
    filterCount: document.querySelector('#showFilters .filter-count'),
    resultsList: document.getElementById('searchResultsList'),
    loadMore: document.getElementById('loadMoreResults'),
    filtersModal: document.getElementById('filtersModal'),
    filtersContent: document.getElementById('filtersContent'),
    resetFilters: document.getElementById('resetFilters'),
    applyFilters: document.getElementById('applyFilters'),
    closeModal: document.querySelector('.close-modal')
  };

  // Проверяем наличие всех необходимых элементов
  const missingElements = Object.entries(elements)
    .filter(([key, element]) => !element)
    .map(([key]) => key);

  if (missingElements.length > 0) {
    console.error('Missing search elements:', missingElements);
    return;
  }

  await db.init();
  bindEvents();
  setupInfiniteScroll();
  loadInitialData();
}

// Загрузка начальных данных
async function loadInitialData(retry = 0) {
  try {
    // Всегда нормализуем данные перед импортом
    const typeToVar = {
      spells: window.allSpells ? normalizeSpells(window.allSpells) : [],
      monsters: window.allMonsters ? normalizeMonsters(window.allMonsters, window.monsterSize, window.aBioms, window.monsterSources) : [],
      items: window.allItems ? normalizeItems(window.allItems, window.oTypes) : [],
      artifacts: window.allArt ? normalizeArtifacts(window.allArt) : []
    };
    // Проверяем, есть ли хоть какие-то данные
    const allEmpty = Object.values(typeToVar).every(arr => !Array.isArray(arr) || arr.length === 0);
    if (allEmpty && retry < 10) {
      setTimeout(() => loadInitialData(retry + 1), 200);
      return;
    }
    console.log('Данные для поиска:', typeToVar);
    for (const [type, data] of Object.entries(typeToVar)) {
      if (Array.isArray(data)) {
        await db.clearStore(type); // Очищаем store перед импортом
        await db.importFromJSON(type, data);
      }
    }
    performSearch();
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
}

// Привязка событий
function bindEvents() {
  // Открытие/закрытие панели
  document.getElementById('searchViewBtn').addEventListener('click', () => {
    elements.sidebar.classList.add('active');
  });

  elements.closeSidebar.addEventListener('click', () => {
    elements.sidebar.classList.remove('active');
  });

  // Поиск
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    clearTimeout(state.searchTimeout);
    state.searchTimeout = setTimeout(() => {
      state.page = 1;
      performSearch();
    }, SEARCH_DELAY);
  });

  elements.clearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    state.page = 1;
    performSearch();
  });

  // --- Исправление выделения вкладки 'Все' ---
  const allTab = document.querySelector('.search-tab-all');
  const sectionTabs = document.querySelectorAll('.search-tabs .search-tab');
  if (allTab) {
    allTab.addEventListener('click', () => {
      state.currentType = 'all';
      state.filters = {};
      state.page = 1;
      updateFilterCount();
      updateTabStyles();
      performSearch();
    });
  }
  if (sectionTabs.length) {
    sectionTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        state.currentType = tab.dataset.type;
        state.filters = {};
        state.page = 1;
        updateFilterCount();
        updateTabStyles();
        performSearch();
      });
    });
  }

  // Фильтры
  elements.showFilters.addEventListener('click', showFiltersModal);
  elements.resetFilters.addEventListener('click', resetFilters);
  elements.applyFilters.addEventListener('click', applyFilters);
  elements.closeModal.addEventListener('click', () => {
    elements.filtersModal.classList.remove('active');
  });

  // Drag & Drop
  elements.resultsList.addEventListener('dragstart', handleDragStart);
  elements.resultsList.addEventListener('dragend', handleDragEnd);
}

// Настройка бесконечного скролла
function setupInfiniteScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !state.isLoading && state.hasMore) {
        state.page++;
        performSearch(true);
      }
    });
  }, { threshold: 0.5 });

  observer.observe(elements.loadMore);
}

// Поиск
async function performSearch(append = false) {
  if (state.isLoading) return;
  state.isLoading = true;

  try {
    let results = [];
    let fullResults = [];
    const query = state.searchQuery.trim().toLowerCase();

    // Получаем все данные из базы
    if (state.currentType === 'all') {
      const types = ['spells', 'monsters', 'items', 'artifacts'];
      for (const type of types) {
        let typeResults = await db.getItems(type);
        typeResults = typeResults.map(item => ({ ...item, type }));
        results = results.concat(typeResults);
      }
      fullResults = results.slice();
    } else {
      results = await db.getItems(state.currentType);
      results = results.map(item => ({ ...item, type: state.currentType }));
      fullResults = results.slice();
    }
    state.fullResults = fullResults;

    // Фильтрация по поисковому запросу
    if (query) {
      results = results.filter(item => {
        const searchableText = [
          item.name,
          item.description || item.desc || item.text,
          item.type,
          item.rarity,
          item.school,
          item.level,
          item.source
        ].filter(Boolean).join(' ').toLowerCase();
        return searchableText.includes(query);
      });
    }

    // Применение фильтров
    if (Object.keys(state.filters).length > 0) {
      results = applyFiltersToResults(results);
    }

    state.results = results;

    // Пагинация
    const start = 0;
    const end = state.page * RESULTS_PER_PAGE;
    const pageResults = results.slice(start, end);
    state.hasMore = end < results.length;

    // Лог для отладки
    console.log('Найдено результатов:', results.length);

    // Отображение результатов
    if (append) {
      appendResults(pageResults);
    } else {
      renderResults(pageResults);
    }

    elements.loadMore.style.display = state.hasMore ? 'block' : 'none';
  } catch (error) {
    console.error('Search error:', error);
    elements.resultsList.innerHTML = '<div class="search-error">Ошибка поиска. Попробуйте позже.</div>';
  } finally {
    state.isLoading = false;
  }
}

// Применение фильтров к результатам
function applyFiltersToResults(results) {
  return results.filter(item => {
    return Object.entries(state.filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      if (key === 'type' && state.currentType === 'monsters') {
        const t = (item.typeRu || item.type || '').split('(')[0].trim();
        return values.some(value => t.startsWith(value));
      }
      if (key === 'type' && (state.currentType === 'items' || state.currentType === 'artifacts')) {
        // Для предметов и артефактов фильтруем по typeRu
        const t = (item.typeRu || item.type || '').trim();
        return values.some(value => t === value);
      }
      return values.some(value =>
        item[key] && item[key].toString().toLowerCase() === value.toLowerCase()
      );
    });
  });
}

// Отображение результатов
function renderResults(results) {
  elements.resultsList.innerHTML = '';
  appendResults(results);
}

// Добавление результатов
function appendResults(results) {
  results.forEach(item => {
    // Используем createCompactCard для красивых карточек
    const card = document.createElement('div');
    card.className = 'result-item';
    card.draggable = true;
    card.dataset.type = item.type;
    card.dataset.id = item.id;
    card._item = item;
    card.innerHTML = window.createCompactCard(item, item.type, undefined, false);
    // Открытие модалки по клику
    card.addEventListener('click', () => {
      const modal = document.getElementById('modal');
      const modalHeader = document.getElementById('modalHeader');
      const modalContent = document.getElementById('modalContent');
      if (item.type === 'spells') {
        import('./uiHandlers.js').then(mod => mod.showSpellDetails(item, modal, modalHeader, modalContent));
      } else {
        import('./uiHandlers.js').then(mod => mod.showItemDetails(item, item.type, modal, modalHeader, modalContent));
      }
    });
    // DnD
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    elements.resultsList.appendChild(card);
  });
  // Для тултипов компонентов
  if (window.bindSpellComponentTooltips) window.bindSpellComponentTooltips();
}

// Обработчики Drag & Drop
function handleDragStart(e) {
  if (!e.target.classList.contains('result-item')) return;
  e.target.classList.add('dragging');
  // Кладём в dataTransfer весь объект item
  const item = e.target._item;
  if (item) {
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  } else {
    // fallback на старый вариант
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: e.target.dataset.type,
      id: e.target.dataset.id
    }));
  }
}

function handleDragEnd(e) {
  if (!e.target.classList.contains('result-item')) return;
  e.target.classList.remove('dragging');
}

// Показ модального окна фильтров
function showFiltersModal() {
  const filters = getFiltersForType(state.currentType);
  renderFilters(filters);
  elements.filtersModal.classList.add('active');
}

// Получение фильтров для типа
function getFiltersForType(type) {
  const filters = [];
  
  // Общие фильтры
  filters.push({
    key: 'source',
    label: 'Источник',
    type: 'select',
    multiple: true
  });
  
  // Специфичные фильтры
  switch (type) {
    case 'spells':
      filters.push(
        {
          key: 'school',
          label: 'Школа',
          type: 'select',
          multiple: true
        },
        {
          key: 'level',
          label: 'Уровень',
          type: 'select',
          multiple: true
        }
      );
      break;
    case 'items':
      filters.push(
        {
          key: 'type',
          label: 'Тип',
          type: 'select',
          multiple: true
        }
      );
      break;
    case 'artifacts':
      filters.push(
        {
          key: 'rarity',
          label: 'Редкость',
          type: 'select',
          multiple: true
        },
        {
          key: 'type',
          label: 'Тип',
          type: 'select',
          multiple: true
        }
      );
      break;
    case 'monsters':
      filters.push(
        {
          key: 'type',
          label: 'Тип',
          type: 'select',
          multiple: true
        },
        {
          key: 'size',
          label: 'Размер',
          type: 'select',
          multiple: true
        },
        {
          key: 'challenge_rating',
          label: 'Опасность',
          type: 'select',
          multiple: true
        }
      );
      break;
  }
  
  return filters;
}

// Отрисовка фильтров
function renderFilters(filters) {
  elements.filtersContent.innerHTML = '';
  filters.forEach(filter => {
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group';
    const label = document.createElement('label');
    label.textContent = filter.label;
    filterGroup.appendChild(label);

    // Получаем уникальные значения для фильтра
    let values = new Set();
    if (filter.key === 'school' && state.currentType === 'spells') {
      state.fullResults.forEach(item => {
        if (item.school && typeof item.school === 'string' && item.school.trim() && isNaN(item.school)) {
          values.add(item.school.trim());
        }
      });
    } else if (filter.key === 'level' && state.currentType === 'spells') {
      state.fullResults.forEach(item => {
        if (typeof item.level === 'number' && item.level >= 0 && item.level <= 9) {
          values.add(item.level);
        }
      });
    } else if (filter.key === 'type' && state.currentType === 'monsters') {
      state.fullResults.forEach(item => {
        let t = item.typeRu || item.type;
        if (t && t !== 'monsters') {
          t = t.split('(')[0].trim();
          t = t.split(' ')[0].trim();
          values.add(t);
        }
      });
    } else if (filter.key === 'type' && (state.currentType === 'items' || state.currentType === 'artifacts')) {
      state.fullResults.forEach(item => {
        let t = item.typeRu || item.type;
        if (t && t !== 'items' && t !== 'artifacts' && t !== 'Неизвестный тип') {
          values.add(t);
        }
      });
    } else {
      state.fullResults.forEach(item => {
        if (item[filter.key]) {
          values.add(item[filter.key]);
        }
      });
    }
    values = Array.from(values).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return a.toString().localeCompare(b.toString(), 'ru');
    });

    // Рендерим теги-кнопки
    const tagList = document.createElement('div');
    tagList.className = 'tag-list';
    values.forEach(value => {
      const tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'filter-tag';
      tag.textContent = value;
      if (state.filters[filter.key] && state.filters[filter.key].includes(value.toString())) {
        tag.classList.add('active');
      }
      tag.addEventListener('click', () => {
        if (!state.filters[filter.key]) state.filters[filter.key] = [];
        const idx = state.filters[filter.key].indexOf(value.toString());
        if (idx === -1) {
          state.filters[filter.key].push(value.toString());
        } else {
          state.filters[filter.key].splice(idx, 1);
        }
        // Обновить UI
        renderFilters(filters);
      });
      tagList.appendChild(tag);
    });
    filterGroup.appendChild(tagList);
    elements.filtersContent.appendChild(filterGroup);
  });
}

// Сброс фильтров
function resetFilters() {
  state.filters = {};
  updateFilterCount();
  performSearch();
  elements.filtersModal.classList.remove('active');
}

// Применение фильтров
function applyFilters() {
  // Собираем выбранные теги
  const filters = {};
  const form = elements.filtersContent;
  form.querySelectorAll('.filter-group').forEach(group => {
    const key = group.querySelector('label').textContent;
    const tagButtons = group.querySelectorAll('.filter-tag.active');
    if (tagButtons.length) {
      // Получаем ключ фильтра по label
      const filterObj = getFiltersForType(state.currentType).find(f => f.label === key);
      const filterKey = filterObj ? filterObj.key : null;
      if (filterKey) {
        filters[filterKey] = Array.from(tagButtons).map(btn => btn.textContent);
      }
    }
  });
  state.filters = filters;
  updateFilterCount();
  performSearch();
  elements.filtersModal.classList.remove('active');
}

// Обновление счетчика фильтров
function updateFilterCount() {
  const count = Object.values(state.filters).reduce((sum, values) => sum + values.length, 0);
  elements.filterCount.textContent = count > 0 ? count : '';
  elements.filterCount.style.display = count > 0 ? 'inline' : 'none';
}

// --- Исправление выделения вкладки 'Все' и разделов ---
function updateTabStyles() {
  const allTab = document.querySelector('.search-tab-all');
  const sectionTabs = document.querySelectorAll('.search-tabs .search-tab');
  if (allTab) {
    if (state.currentType === 'all') {
      allTab.classList.add('active');
      allTab.classList.add('all-active'); // для белой обводки
    } else {
      allTab.classList.remove('active');
      allTab.classList.remove('all-active');
    }
  }
  sectionTabs.forEach(tab => {
    if (tab.dataset.type === state.currentType) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

// Экспортируем функции
export {
  initSearch,
  performSearch,
  showFiltersModal,
  resetFilters,
  applyFilters
};
