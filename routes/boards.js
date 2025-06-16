const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../data/boards.sqlite');

// Инициализация базы и таблицы
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка подключения к SQLite:', err.message);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// Получить список досок
router.get('/', (req, res) => {
  db.all('SELECT id, name, created_at, updated_at FROM boards ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Получить доску по id
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM boards WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Доска не найдена' });
    
    // Parse the content JSON string
    try {
      row.content = JSON.parse(row.content);
      // Гарантируем, что есть notes и connections
      if (!Array.isArray(row.content.notes)) row.content.notes = [];
      if (!Array.isArray(row.content.connections)) row.content.connections = [];
    } catch (parseErr) {
      console.error('Error parsing board content:', parseErr);
      row.content = { notes: [], connections: [] };
    }
    
    res.json(row);
  });
});

// Получить содержимое доски (content)
router.get('/:id/content', (req, res) => {
  db.get('SELECT content FROM boards WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Доска не найдена' });
    res.json({ content: row.content });
  });
});

// Создать новую доску
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя доски обязательно' });
  db.run('INSERT INTO boards (name) VALUES (?)', [name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM boards WHERE id = ?', [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json(row);
    });
  });
});

// Сохранить содержимое доски (content)
router.post('/:id/content', (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string') return res.status(400).json({ error: 'content должен быть строкой (JSON)' });
  db.run('UPDATE boards SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [content, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Доска не найдена' });
    res.json({ success: true });
  });
});

// Удалить доску
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM boards WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Доска не найдена' });
    res.json({ success: true });
  });
});

module.exports = router; 