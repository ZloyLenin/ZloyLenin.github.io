const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Инициализация таблиц при запуске
async function initDatabase() {
  try {
    // Создание таблицы boards если её нет
    await db.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Таблица boards готова');
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Подключение маршрутов авторизации
const authRoutes = require('./routes/auth');
const auth = require('./middleware/auth');

// Статические файлы
app.use(express.static('public'));

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/boards', require('./routes/boards'));

// Создаем директорию data, если она не существует
const dataDir = path.join(__dirname, 'data');
fs.mkdir(dataDir, { recursive: true }).catch(console.error);

// Защищенные маршруты
app.get('/board.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'board.html'));
});

// Эндпоинт для сохранения состояния (защищенный)
app.post('/save-state', auth, async (req, res) => {
  try {
    const state = req.body;
    const filePath = path.join(dataDir, `state_${req.user.id}.json`);
    
    // Создаем директорию, если она не существует
    await fs.mkdir(dataDir, { recursive: true });
    
    // Сохраняем состояние
    await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения состояния:', error);
    res.status(500).json({ 
      error: 'Ошибка сохранения состояния',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Эндпоинт для загрузки состояния (защищенный)
app.get('/load-state', auth, async (req, res) => {
  try {
    const filePath = path.join(dataDir, `state_${req.user.id}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Если файл не существует, возвращаем пустое состояние
      res.json({ notes: [], connections: [] });
    } else {
      console.error('Ошибка загрузки состояния:', error);
      res.status(500).json({ 
        error: 'Ошибка загрузки состояния',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Что-то пошло не так!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
  });
});