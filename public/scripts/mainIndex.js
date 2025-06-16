import { fetchBoards, createBoard, deleteBoard } from './boardState.js';

// --- Кнопка аккаунта ---
const accountBtn = document.querySelector('.fantasy-account-btn');
if (accountBtn) {
  accountBtn.onclick = () => {
    window.location.href = 'account.html';
  };
}

// --- Модальное окно для кости ---
function parseDiceFormula(formula) {
  const match = formula.match(/(\d*)d(\d+)([+-]\d+)?/i);
  if (!match) return null;
  const count = parseInt(match[1] || '1', 10);
  const die = parseInt(match[2], 10);
  const mod = match[3] ? parseInt(match[3], 10) : 0;
  return { count, die, mod };
}

function rollDice(formula) {
  const parsed = parseDiceFormula(formula);
  if (!parsed) return 'Ошибка формулы';
  let total = 0;
  let rolls = [];
  for (let i = 0; i < parsed.count; i++) {
    const val = Math.floor(Math.random() * parsed.die) + 1;
    rolls.push(val);
    total += val;
  }
  total += parsed.mod;
  return `${rolls.join(' + ')}${parsed.mod ? (parsed.mod > 0 ? ' + ' : ' - ') + Math.abs(parsed.mod) : ''} = ${total}`;
}

function showDiceModal() {
  let modal = document.getElementById('fantasy-dice-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'fantasy-dice-modal';
    modal.style.position = 'fixed';
    modal.style.left = 0;
    modal.style.top = 0;
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.35)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = 2000;
    modal.innerHTML = `
      <div class="fantasy-modal-content" style="min-width: 340px; text-align: center; position: relative; padding: 36px 48px; border-radius: 22px; box-shadow: 0 6px 32px 0 rgba(80,60,20,0.18);">
        <h2 class="fantasy-modal-title" style="font-family: 'Uncial Antiqua', serif; font-size: 2em; margin-bottom: 18px;"><i class="fa-solid fa-dice-d20"></i> Бросок кости</h2>
        <div style="margin-bottom: 12px;">
          <select id="dice-type" style="font-size:1.1em;padding:6px 12px;border-radius:8px;">
            <option value="d4">d4</option>
            <option value="d6">d6</option>
            <option value="d8">d8</option>
            <option value="d10">d10</option>
            <option value="d12">d12</option>
            <option value="d20" selected>d20</option>
            <option value="d100">d100</option>
          </select>
          <input id="dice-count" type="number" min="1" max="20" value="1" style="width:48px;font-size:1.1em;margin-left:8px;border-radius:8px;padding:6px;">
          <input id="dice-mod" type="number" value="0" style="width:48px;font-size:1.1em;margin-left:8px;border-radius:8px;padding:6px;">
        </div>
        <div style="margin-bottom: 8px;">или формула: <input id="dice-formula" type="text" placeholder="2d6+3" style="width:90px;font-size:1.1em;border-radius:8px;padding:6px;"></div>
        <div id="dice-result" style="font-size: 1.5em; margin-bottom: 18px;">🎲</div>
        <button id="roll-again" class="fantasy-btn" style="margin-bottom:12px;"><i class="fa-solid fa-dice"></i> Бросить</button><br>
        <button id="close-dice-modal" class="fantasy-btn">Закрыть</button>
      </div>
    `;
    document.body.appendChild(modal);

    const rollAgainBtn = modal.querySelector('#roll-again');
    const closeDiceModalBtn = modal.querySelector('#close-dice-modal');
    const diceTypeSelect = modal.querySelector('#dice-type');
    const diceCountInput = modal.querySelector('#dice-count');
    const diceModInput = modal.querySelector('#dice-mod');
    const diceFormulaInput = modal.querySelector('#dice-formula');
    const diceResult = modal.querySelector('#dice-result');

    function roll() {
      let formula = diceFormulaInput.value.trim();
      if (!formula) {
        // Формируем формулу из селекторов
        const type = diceTypeSelect.value;
        const count = parseInt(diceCountInput.value, 10) || 1;
        const mod = parseInt(diceModInput.value, 10) || 0;
        formula = `${count}${type}${mod ? (mod > 0 ? '+' + mod : mod) : ''}`;
      }
      const parsed = parseDiceFormula(formula);
      if (!parsed) {
        diceResult.textContent = 'Ошибка формулы';
        return;
      }
      let total = 0;
      let rolls = [];
      for (let i = 0; i < parsed.count; i++) {
        const val = Math.floor(Math.random() * parsed.die) + 1;
        rolls.push(val);
        total += val;
      }
      total += parsed.mod;
      diceResult.textContent = `${rolls.join(' + ')}${parsed.mod ? (parsed.mod > 0 ? ' + ' : ' - ') + Math.abs(parsed.mod) : ''} = ${total}`;
    }

    rollAgainBtn.onclick = roll;
    closeDiceModalBtn.onclick = () => modal.remove();
    diceTypeSelect.onchange = () => { diceFormulaInput.value = ''; };
    diceCountInput.oninput = () => { diceFormulaInput.value = ''; };
    diceModInput.oninput = () => { diceFormulaInput.value = ''; };
    diceFormulaInput.oninput = () => {};
    modal.addEventListener('mousedown', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
  // Always define roll in this scope for the modal
  const rollAgainBtn = modal.querySelector('#roll-again');
  if (rollAgainBtn) {
    rollAgainBtn.onclick = function() {
      let diceTypeSelect = modal.querySelector('#dice-type');
      let diceCountInput = modal.querySelector('#dice-count');
      let diceModInput = modal.querySelector('#dice-mod');
      let diceFormulaInput = modal.querySelector('#dice-formula');
      let diceResult = modal.querySelector('#dice-result');
      let formula = diceFormulaInput.value.trim();
      if (!formula) {
        const type = diceTypeSelect.value;
        const count = parseInt(diceCountInput.value, 10) || 1;
        const mod = parseInt(diceModInput.value, 10) || 0;
        formula = `${count}${type}${mod ? (mod > 0 ? '+' + mod : mod) : ''}`;
      }
      const parsed = parseDiceFormula(formula);
      if (!parsed) {
        diceResult.textContent = 'Ошибка формулы';
        return;
      }
      let total = 0;
      let rolls = [];
      for (let i = 0; i < parsed.count; i++) {
        const val = Math.floor(Math.random() * parsed.die) + 1;
        rolls.push(val);
        total += val;
      }
      total += parsed.mod;
      diceResult.textContent = `${rolls.join(' + ')}${parsed.mod ? (parsed.mod > 0 ? ' + ' : ' - ') + Math.abs(parsed.mod) : ''} = ${total}`;
    };
  }
  const closeDiceModalBtn = modal.querySelector('#close-dice-modal');
  if (closeDiceModalBtn) {
    closeDiceModalBtn.onclick = () => modal.remove();
  }
  modal.addEventListener('mousedown', (e) => {
    if (e.target === modal) modal.remove();
  });
  // Initial roll
  if (rollAgainBtn) rollAgainBtn.onclick();
}

const fabDice = document.querySelector('.fantasy-fab-dice');
if (fabDice) fabDice.onclick = showDiceModal;

// --- Работа с досками ---
const boardList = document.querySelector('.fantasy-board-list');
const createBtn = document.querySelector('.fantasy-create-btn');

async function renderBoards() {
  if (!boardList) return;
  boardList.innerHTML = '';
  try {
    const boards = await fetchBoards();
    boards.forEach(board => {
      const li = document.createElement('li');
      li.className = 'fantasy-board-item';
      li.innerHTML = `<i class="fa-solid fa-note-sticky"></i> ${board.name}
        <div class="fantasy-board-actions">
          <button class="fantasy-board-btn" title="Удалить"><i class="fa-solid fa-trash"></i></button>
        </div>`;
      
      li.onclick = () => {
        window.location.href = `board.html?id=${board.id}`;
      };

      li.querySelector('.fa-trash').closest('button').onclick = async (e) => {
        e.stopPropagation();
        if (confirm('Удалить доску?')) {
          await deleteBoard(board.id);
          renderBoards();
        }
      };

      boardList.appendChild(li);
    });
  } catch (e) {
    boardList.innerHTML = '<li style="color:red;">Ошибка загрузки досок</li>';
  }
}

if (createBtn) {
  createBtn.onclick = async () => {
    const name = prompt('Название новой доски:', 'Новая доска');
    if (name) {
      await createBoard(name);
      renderBoards();
    }
  };
}

renderBoards(); 