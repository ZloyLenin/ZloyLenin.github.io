const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const auth = require('../middleware/auth');

// Регистрация
router.post('/register', async (req, res) => {
  console.log('Registration attempt (currently disabled).');
  // Отправляем успешный ответ, чтобы клиентская часть не зависала
  // Но регистрация фактически не происходит.
  res.status(200).json({ message: 'Регистрация временно отключена. Используйте существующий аккаунт.' });
  // Чтобы полностью отключить регистрацию, можно закомментировать всю секцию выше
  // или вернуть ошибку 403, если регистрация нежелательна.
});

// Авторизация
router.post('/login', async (req, res) => {
  console.log('Login attempt (currently disabled).');
  // Отправляем успешный ответ, чтобы клиентская часть не зависала
  // Но авторизация фактически не происходит.
  res.status(200).json({ token: 'mock-token', message: 'Вход временно отключен.' });
});

// Получение профиля пользователя
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Верификация токена
router.get('/verify', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление аккаунта пользователя
router.delete('/delete', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    // Удаляем пользователя
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении аккаунта' });
  }
});

module.exports = router; 