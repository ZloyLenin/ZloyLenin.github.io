// Конфигурация базы данных
const DB_CONFIG = {
  name: 'game_data.db',
  version: 2
};

// Структура таблиц
const SCHEMA = {
  spells: `
    CREATE TABLE IF NOT EXISTS spells (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level INTEGER,
      school TEXT,
      casting_time TEXT,
      range TEXT,
      components TEXT,
      duration TEXT,
      description TEXT,
      source TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  monsters: `
    CREATE TABLE IF NOT EXISTS monsters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      size TEXT,
      alignment TEXT,
      ac INTEGER,
      hp INTEGER,
      speed TEXT,
      stats TEXT,
      skills TEXT,
      damage_vulnerabilities TEXT,
      damage_resistances TEXT,
      damage_immunities TEXT,
      condition_immunities TEXT,
      senses TEXT,
      languages TEXT,
      challenge_rating TEXT,
      xp INTEGER,
      traits TEXT,
      actions TEXT,
      legendary_actions TEXT,
      source TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  items: `
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      rarity TEXT,
      cost TEXT,
      weight TEXT,
      description TEXT,
      source TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  artifacts: `
    CREATE TABLE IF NOT EXISTS artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      rarity TEXT,
      attunement BOOLEAN,
      description TEXT,
      source TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
};

// Класс для работы с базой данных
class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Удаляем все старые object stores
        Array.from(db.objectStoreNames).forEach(storeName => {
          db.deleteObjectStore(storeName);
        });
        // Создаем новые object stores
        Object.entries(SCHEMA).forEach(([storeName, schema]) => {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        });
      };
    });
  }

  // Методы для работы с данными
  async addItem(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getItems(storeName, query = null) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let items = request.result;
        if (query) {
          items = items.filter(item => 
            Object.entries(query).every(([key, value]) => 
              item[key] && item[key].toString().toLowerCase().includes(value.toLowerCase())
            )
          );
        }
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Метод для импорта данных из JSON
  async importFromJSON(storeName, data) {
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return Promise.all(data.map(item => 
      new Promise((resolve, reject) => {
        const request = store.add(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
    ));
  }

  // Метод для очистки object store
  async clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Экспортируем экземпляр базы данных
export const db = new Database(); 