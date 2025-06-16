const { spawn } = require('child_process');
const path = require('path');
const ngrok = require('ngrok');

async function startServer() {
  // Запускаем сервер
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
  });

  // Ждем 2 секунды, чтобы сервер успел запуститься
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Запускаем ngrok
    const url = await ngrok.connect({
      addr: process.env.PORT || 3000,
      authtoken: process.env.NGROK_AUTH_TOKEN // Опционально, для постоянного URL
    });

    console.log('\n=== Демонстрационный сервер запущен ===');
    console.log('Локальный URL:', `http://localhost:${process.env.PORT || 3000}`);
    console.log('Публичный URL:', url);
    console.log('\nДемо-пользователь:');
    console.log('Логин: demo');
    console.log('Пароль: demo123');
    console.log('\nДля остановки сервера нажмите Ctrl+C\n');

    // Обработка завершения работы
    process.on('SIGINT', async () => {
      console.log('\nОстанавливаем сервер...');
      await ngrok.kill();
      server.kill();
      process.exit();
    });

  } catch (error) {
    console.error('Ошибка при запуске ngrok:', error);
    server.kill();
    process.exit(1);
  }
}

// Сначала инициализируем демо-базу, затем стартуем сервер
require('./setup-demo.js');
startServer(); 