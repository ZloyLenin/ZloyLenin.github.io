// Модуль для нормализации данных монстров, заклинаний, артефактов и предметов

export const sourceMapping = {
  'PHB': 'Player\'s Handbook',
  'XG': 'Xanathar\'s Guide to Everything',
  'EE': 'Elemental Evil Player\'s Companion',
  'SCAG': 'Sword Coast Adventurer\'s Guide',
  'TCE': 'Tasha\'s Cauldron of Everything',
  'M': 'Mordenkainen\'s Tome of Foes',
  'GGR': 'Guildmasters\' Guide to Ravnica',
  'VGM': 'Volo\'s Guide to Monsters',
  'EGW': 'Explorer\'s Guide to Wildemount',
  'R': 'Rise of Tiamat',
  'DMG': 'Dungeon Master\'s Guide',
  'MM': 'Monster Manual',
  'ToA': "Tomb of Annihilation",
  'AI': "Acquisitions Incorporated",
  'FTD': "Fizban's treasury of dragons",
  'SCC': "Strixhaven: A Curriculum of Chaos",
  'SCPC': "Sprouting Chaos - Player's Companion",
  'TCoE': "Sword Coast Adventurer's Guide",
  'HB': 'Homebrew'
};

const rarityMap = {
  0: "Обычный",
  1: "Необычный",
  2: "Редкий",
  3: "Очень редкий",
  4: "Легендарный",
  5: "Артефакт"
};

// Добавляем словарь для перевода типов предметов
const itemTypeMap = {
  'Armor': 'Доспех',
  'Weapon': 'Оружие',
  'Potion': 'Зелье',
  'Ring': 'Кольцо',
  'Rod': 'Жезл',
  'Scroll': 'Свиток',
  'Staff': 'Посох',
  'Wand': 'Волшебная палочка',
  'Wonderous Item': 'Чудесный предмет',
  'Wondrous Item': 'Чудесный предмет',
  'Wondrous item': 'Чудесный предмет',
  'Shield': 'Щит',
  'Ammunition': 'Боеприпасы',
  'Light Armor': 'Легкий доспех',
  'Medium Armor': 'Средний доспех',
  'Heavy Armor': 'Тяжелый доспех',
  'Melee Weapon': 'Рукопашное оружие',
  'Ranged Weapon': 'Дальнобойное оружие',
  'Adventuring Gear': 'Снаряжение',
  'Tool': 'Инструмент',
  'Gaming Set': 'Игровой набор',
  'Vehicle': 'Транспорт',
  'Trade Good': 'Товар',
  'Container': 'Контейнер',
  'Equipment Pack': 'Набор снаряжения',
  'Consumables': 'Расходуемое',
  'Gear': 'Снаряжение',
  'Camp': 'Снаряжение для лагеря',
  'Kit': 'Набор',
  'Clothes': 'Одежда',
  'Arcane Focus': 'Арканический фокус',
  'Druidic Focus': 'Друидический фокус',
  'Holly Simbol': 'Священный символ',
  'Arcane focus': 'Арканический фокус',
  'Druidic focus': 'Друидический фокус',
  'Holly simbol': 'Священный символ',
};

// Добавляем словарь для перевода свойств оружия
const oWeaponProps = {
  'light': {
    text: {
      ru: {
        title: 'легкое'
      }
    }
  },
  'heavy': {
    text: {
      ru: {
        title: 'тяжелое'
      }
    }
  },
  'finesse': {
    text: {
      ru: {
        title: 'фехтовальное'
      }
    }
  },
  'thrown': {
    text: {
      ru: {
        title: 'метательное'
      }
    }
  },
  'reach': {
    text: {
      ru: {
        title: 'длинное'
      }
    }
  },
  'two-handed': {
    text: {
      ru: {
        title: 'двуручное'
      }
    }
  },
  'versatile': {
    text: {
      ru: {
        title: 'универсальное'
      }
    }
  },
  'ammunition': {
    text: {
      ru: {
        title: 'боеприпас'
      }
    }
  },
  'loading': {
    text: {
      ru: {
        title: 'перезарядка'
      }
    }
  },
  'special': {
    text: {
      ru: {
        title: 'особое'
      }
    }
  },
  'range': {
    text: {
      ru: {
        title: 'дистанция'
      }
    }
  }
};

// Добавляем словарь для перевода типов урона
const oDamageType = {
  'slashing': {
    text: {
      ru: {
        title: 'рубящий'
      }
    }
  },
  'piercing': {
    text: {
      ru: {
        title: 'колющий'
      }
    }
  },
  'bludgeoning': {
    text: {
      ru: {
        title: 'дробящий'
      }
    }
  },
  'fire': {
    text: {
      ru: {
        title: 'огненный'
      }
    }
  },
  'cold': {
    text: {
      ru: {
        title: 'холод'
      }
    }
  },
  'lightning': {
    text: {
      ru: {
        title: 'электричество'
      }
    }
  },
  'acid': {
    text: {
      ru: {
        title: 'кислота'
      }
    }
  },
  'poison': {
    text: {
      ru: {
        title: 'яд'
      }
    }
  },
  'psychic': {
    text: {
      ru: {
        title: 'психический'
      }
    }
  },
  'necrotic': {
    text: {
      ru: {
        title: 'некротический'
      }
    }
  },
  'radiant': {
    text: {
      ru: {
        title: 'излучение'
      }
    }
  },
  'force': {
    text: {
      ru: {
        title: 'силовой'
      }
    }
  },
  'thunder': {
    text: {
      ru: {
        title: 'звук'
      }
    }
  }
};

// Добавляем словарь для перевода дополнительных свойств типа
const oTypeAdditions = {
  'light': {
    text: {
      ru: {
        title: 'легкий'
      }
    }
  },
  'medium': {
    text: {
      ru: {
        title: 'средний'
      }
    }
  },
  'heavy': {
    text: {
      ru: {
        title: 'тяжелый'
      }
    }
  },
  'simple': {
    text: {
      ru: {
        title: 'простой'
      }
    }
  },
  'martial': {
    text: {
      ru: {
        title: 'воинский'
      }
    }
  },
  'melee': {
    text: {
      ru: {
        title: 'рукопашный'
      }
    }
  },
  'ranged': {
    text: {
      ru: {
        title: 'дальнобойный'
      }
    }
  },
  'shield': {
    text: {
      ru: {
        title: 'щит'
      }
    }
  }
};

// Добавляем словарь для перевода типов снаряжения
const equipmentTypeMap = {
  'Adventuring Gear': 'Снаряжение',
  'Tool': 'Инструмент',
  'Gaming Set': 'Игровой набор',
  'Vehicle': 'Транспорт',
  'Trade Good': 'Товар',
  'Container': 'Контейнер',
  'Equipment Pack': 'Набор снаряжения',
  'Ammunition': 'Боеприпасы'
};

// Добавляем словарь для валюты
const currencyMap = {
  'cp': { symbol: 'мм', tooltip: 'медные монеты' },
  'sp': { symbol: 'см', tooltip: 'серебряные монеты' },
  'ep': { symbol: 'эм', tooltip: 'электрумовые монеты' },
  'gp': { symbol: 'зм', tooltip: 'золотые монеты' },
  'pp': { symbol: 'пм', tooltip: 'платиновые монеты' }
};

// Функция для форматирования стоимости
function formatCurrency(value) {
  if (!value) return null;
  
  // Разбиваем строку на число и валюту
  const match = value.toString().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/i);
  if (!match) return value;

  const [_, amount, currency] = match;
  const currencyInfo = currencyMap[currency.toLowerCase()];
  
  if (!currencyInfo) return value;
  
  return {
    display: `${amount} ${currencyInfo.symbol}`,
    tooltip: `${amount} ${currencyInfo.tooltip}`,
    value: parseFloat(amount),
    currency: currency.toLowerCase()
  };
}

// Функция для удаления HTML-ссылок из текста, сохраняя текст внутри ссылок
function removeHtmlLinks(text) {
  if (!text) return text;
  return text.replace(/<a\s+href=['"][^'"]*['"]>([^<]*)<\/a>/g, '$1');
}

// Маппинг типов монстров EN → RU
const monsterTypeMap = {
  'aberration': 'аберрация',
  'beast': 'зверь',
  'celestial': 'небожитель',
  'construct': 'конструкт',
  'dragon': 'дракон',
  'elemental': 'элементаль',
  'fey': 'фей',
  'fiend': 'исчадие',
  'giant': 'великан',
  'humanoid': 'гуманоид',
  'monstrosity': 'чудовище',
  'ooze': 'слизь',
  'plant': 'растение',
  'undead': 'нежить',
  'swarm': 'рой',
  'beasts': 'зверь',
  'humanoids': 'гуманоид',
  'shapechanger': 'оборотень',
  '': 'Неизвестно',
  'other': 'другое',
};

// Маппинг размеров монстров EN → RU
const monsterSizeMap = {
  'T': 'Крошечный',
  'Tiny': 'Крошечный',
  'S': 'Маленький',
  'Small': 'Маленький',
  'M': 'Средний',
  'Medium': 'Средний',
  'L': 'Большой',
  'Large': 'Большой',
  'H': 'Огромный',
  'Huge': 'Огромный',
  'G': 'Гигантский',
  'Gargantuan': 'Гигантский',
  '': 'Неизвестно',
};

/**
 * Нормализует данные монстров для отображения
 * @param {Array} monstersData - массив объектов монстров
 * @param {Object} monsterSize - карта размеров монстров
 * @param {Array} aBioms - массив биомов
 * @param {Array} monsterSources - массив источников монстров
 * @returns {Array} нормализованные монстры
 */
function normalizeMonsters(monstersData, monsterSize = {}, aBioms = [], monsterSources = []) {
  return monstersData.map(monster => {
    const ruData = monster.ru || {};
    const enData = monster.en || {};

    // Для числовых характеристик
    function toNum(val, def = 10) {
      if (val === undefined || val === null) return def;
      const n = parseInt(val);
      return isNaN(n) ? def : n;
    }

    // Для строковых характеристик
    function toStr(val, def = '') {
      return val !== undefined && val !== null ? val : def;
    }

    const cr = monster.cr?.toString() || 'Неизвестно';
    const desc = [monster.fiction, monster.trait ? (Array.isArray(monster.trait) ? monster.trait.map(t => t.text || t.name).join(' ') : monster.trait.text || monster.trait.name) : '', monster.action ? (Array.isArray(monster.action) ? monster.action.map(a => a.text || a.name).join(' ') : monster.action.text || monster.action.name) : ''].filter(Boolean).join('\n\n');

    // Тип на русском
    let typeRu = ruData.type || monsterTypeMap[(monster.type || '').toLowerCase()] || monster.type || 'Неизвестно';
    // Размер на русском
    let sizeRu = monsterSizeMap[monster.size] || monsterSize[monster.size] || monster.size || 'Неизвестно';

    return {
      id: (ruData.name || enData.name || monster.name || 'noname').replace(/\s+/g, '-').toLowerCase(),
      name: ruData.name || enData.name || monster.name || 'Безымянный монстр',
      desc,
      description: desc,
      type: typeRu,
      typeRu: typeRu,
      originalType: monster.type || '',
      cr,
      challenge_rating: cr,
      size: sizeRu,
      biom: aBioms.find(b => b.text.key === monster.biom)?.text.title || monster.biom,
      source: monster.source || 'MM',
      sourceFull: monsterSources.find(s => s.key === monster.source)?.title || 'Неизвестный источник',
      ac: toStr(monster.ac),
      hp: toStr(monster.hp),
      speed: toStr(monster.speed),
      alignment: toStr(monster.alignment),
      str: toNum(monster.str),
      dex: toNum(monster.dex),
      con: toNum(monster.con),
      int: toNum(monster.int),
      wis: toNum(monster.wis),
      cha: toNum(monster.cha),
      save: toStr(monster.save),
      skill: toStr(monster.skill),
      resist: toStr(monster.resist),
      immune: toStr(monster.immune),
      conditionImmune: toStr(monster.conditionImmune),
      senses: toStr(monster.senses),
      languages: toStr(monster.languages),
      trait: monster.trait || null,
      action: monster.action || null,
      reaction: monster.reaction || null,
      legendary: monster.legendary || null,
      spells: monster.spells || null,
      fiction: monster.fiction || null
    };
  }).filter(monster => monster !== null);
}

// Функция для нормализации компонентов заклинания
function normalizeSpellComponents(componentsRaw) {
  if (!componentsRaw) return [];
  // Заменяем латинскую M на кириллическую М
  let str = componentsRaw.replace(/\bM\b/g, 'М').replace(/\bV\b/g, 'В').replace(/\bS\b/g, 'С');
  // Удаляем невидимые символы и лишние пробелы
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ');
  // Разбиваем по запятым
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Нормализует данные заклинаний для отображения
 * @param {Array} spellsData - массив объектов заклинаний
 * @returns {Array} нормализованные заклинания
 */
function normalizeSpells(spellsData) {
  const idSet = new Set();
  return spellsData.map(spell => {
    if (!spell.ru) {
      console.error('Отсутствует русская версия заклинания:', spell);
      return null;
    }
    const source = spell.ru.source || spell.en.source || 'PHB';
    const level = spell.ru.level || '0';
    const name = (spell.ru.name || 'noname').replace(/\s+/g, '-').toLowerCase();
    const id = [name, level, source.toLowerCase()].join('-');
    if (idSet.has(id)) {
      console.warn('Дубликат id заклинания:', id, spell);
    }
    idSet.add(id);
    const desc = spell.ru.text ? spell.ru.text.replace(/<br>/g, '\n') : '';
    return {
      id,
      name: spell.ru.name || 'Безымянное заклинание',
      level: parseInt(level) || 0,
      desc,
      description: desc,
      school: (spell.ru.school || '').toLowerCase(),
      components: normalizeSpellComponents(spell.ru.components),
      castingTime: spell.ru.castingTime || 'Не указано',
      range: spell.ru.range || 'Не указано',
      duration: spell.ru.duration || 'Не указано',
      materials: spell.ru.materials || '',
      source: source,
      sourceFull: sourceMapping[source] || 'Неизвестный источник'
    };
  }).filter(spell => spell !== null);
}

/**
 * Нормализует данные артефактов для отображения
 * @param {Array} artifactsData - массив объектов артефактов
 * @returns {Array} нормализованные артефакты
 */
function normalizeArtifacts(artifactsData) {
  return artifactsData.map(art => {
    if (!art.ru || !art.en) {
      console.error('Отсутствует русская или английская версия артефакта:', art);
      return null;
    }
    const desc = removeHtmlLinks(art.ru.text?.replace(/<br>/g, '\n')) || '';
    // Перевод типа для магических предметов
    const itemType = art.en?.type || '';
    const capitalizeWords = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const itemTypeCap = capitalizeWords(itemType);
    let typeRu =
      itemTypeMap[itemTypeCap] ||
      equipmentTypeMap[itemTypeCap] ||
      art.ru?.type ||
      art.en?.type ||
      'Неизвестный тип';
    return {
      id: (art.ru.name || 'noname').replace(/\s+/g, '-').toLowerCase(),
      name: art.ru.name || 'Безымянный артефакт',
      desc,
      description: desc,
      rarity: rarityMap[art.en.rarity] || 'Не указано',
      type: typeRu,
      typeRu: typeRu,
      source: art.en.source || 'DMG',
      sourceFull: sourceMapping[art.en.source] || 'Неизвестный источник'
    };
  }).filter(Boolean);
}

/**
 * Нормализует данные предметов для отображения
 * @param {Array} itemsData - массив объектов предметов
 * @param {Object} oTypes - карта типов предметов
 * @returns {Array} нормализованные предметы
 */
function normalizeItems(itemsData, oTypes = {}) {
  return itemsData.map(item => {
    if (!item.ru || !item.en) {
      console.error('Invalid item data:', item);
      return null;
    }
    
    const desc = item.ru?.text || item.en?.text || '';
    const itemType = item.en?.type || '';
    const typeKey = itemType.toLowerCase();
    // Новый порядок поиска перевода типа
    const capitalizeWords = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const itemTypeCap = capitalizeWords(itemType);
    let typeRu =
      (oTypes[typeKey]?.text?.ru?.title) ||
      itemTypeMap[itemTypeCap] ||
      equipmentTypeMap[itemTypeCap] ||
      item.ru?.type ||
      item.en?.type ||
      'Неизвестный тип';

    const normalized = {
      name: item.ru?.name || item.en?.name || '',
      type: itemType,
      typeRu: typeRu,
      rarity: rarityMap[item.en?.rarity] || '',
      desc,
      description: desc,
      source: item.en?.source || '',
      sourceFull: sourceMapping[item.en?.source] || 'Неизвестный источник',
      img: item.en?.img || '',
      attunement: item.ru?.attunement || item.en?.attunement || '',
      weight: item.en?.weight || null,
      coast: formatCurrency(item.en?.coast),
      ac: item.en?.ac || null,
      damageVal: item.en?.damageVal || null,
      damageType: item.en?.damageType ? (oDamageType[item.en.damageType.toLowerCase()]?.text?.ru?.title || item.en.damageType) : null,
      props: []
    };

    // Добавляем свойства предмета
    if (item.en?.props) {
      normalized.props = item.en.props.map(prop => {
        const propKey = prop.toLowerCase();
        return oWeaponProps[propKey]?.text?.ru?.title || prop;
      });
    }

    // Добавляем дополнительные свойства типа
    if (item.en?.typeAdditions) {
      const matches = item.en.typeAdditions.match(/\((.*?)\)/);
      if (matches && matches[1]) {
        const additions = matches[1].split(',').map(addition => {
          const key = addition.trim().toLowerCase();
          return oTypeAdditions[key]?.text?.ru?.title || addition.trim();
        });
        normalized.typeAdditions = additions.join(', ');
      }
    }

    return normalized;
  }).filter(item => item !== null);
}

export {
  normalizeMonsters,
  normalizeSpells,
  normalizeArtifacts,
  normalizeItems
};
