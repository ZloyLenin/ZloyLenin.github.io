const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Используем PostgreSQL подключение

// Все эндпоинты переведены на async/await и PostgreSQL синтаксис

// Получить список досок
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, created_at, updated_at FROM boards ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении списка досок:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить доску по id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM boards WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Доска не найдена' });
    }
    
    const board = result.rows[0];
    try {
      board.content = JSON.parse(board.content);
      // Гарантируем наличие нужных полей
      if (!Array.isArray(board.content.notes)) board.content.notes = [];
      if (!Array.isArray(board.content.connections)) board.content.connections = [];
    } catch (parseErr) {
      console.error('Ошибка парсинга содержимого доски:', parseErr);
      board.content = { notes: [], connections: [] };
    }
    
    res.json(board);
  } catch (error) {
    console.error('Ошибка при получении доски:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить содержимое доски (content)
router.get('/:id/content', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT content FROM boards WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Доска не найдена' });
    }
    
    res.json({ content: result.rows[0].content });
  } catch (error) {
    console.error('Ошибка при получении содержимого доски:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать новую доску
router.post('/', async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Имя доски обязательно' });
  }
  
  try {
    const result = await db.query(
      'INSERT INTO boards (name) VALUES ($1) RETURNING *',
      [name]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании доски:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Сохранить содержимое доски (content)
router.post('/:id/content', async (req, res) => {
  const { content } = req.body;
  
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'content должен быть строкой (JSON)' });
  }
  
  try {
    const result = await db.query(
      'UPDATE boards SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [content, req.params.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Доска не найдена' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при сохранении содержимого доски:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить доску
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM boards WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Доска не найдена' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении доски:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;