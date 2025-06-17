const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение маршрутов авторизации
// const authRoutes = require('./routes/auth');
// const auth = require('./middleware/auth');

// Статические файлы
app.use(express.static('public'));

// API маршруты
// app.use('/api/auth', authRoutes);
app.use('/api/boards', require('./routes/boards'));

// Создаем директорию data, если она не существует
const dataDir = path.join(__dirname, 'data');
fs.mkdir(dataDir, { recursive: true }).catch(console.error);

// Защищенные маршруты
app.get('/board.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'board.html'));
});

// Сохранение состояния доски
app.post('/save-state', async (req, res) => {
  try {
    const { state } = req.body;
    // Здесь можно добавить сохранение в базу данных
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при сохранении состояния' });
  }
});

// Эндпоинт для загрузки состояния
app.get('/load-state', async (req, res) => {
  try {
    // Возвращаем пустое состояние
    res.json({ notes: [], connections: [] });
  } catch (error) {
    console.error('Ошибка загрузки состояния:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки состояния',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
}); 