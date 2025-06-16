/**
 * Бросает указанное количество кубов с заданным числом граней
 * @param {number} count - количество кубов
 * @param {number} sides - количество граней
 * @returns {{total: number, rolls: number[]}} результат броска
 */
function rollDice(count, sides) {
  const rolls = [];
  let total = 0;
  
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  return { total, rolls };
}

/**
 * Парсит формулу броска дайсов и возвращает результат
 * Поддерживает формат: XdY+Z или XdY-Z, где:
 * X - количество кубов
 * Y - количество граней
 * Z - модификатор (опционально)
 * @param {string} formula - формула броска
 * @returns {{total: number, rolls: number[], formula: string, error: string|null}} результат броска
 */
function parseAndRoll(formula) {
  // Убираем все пробелы
  formula = formula.replace(/\s+/g, '').toLowerCase();
  
  // Проверяем базовый формат
  const diceRegex = /^(\d+)d(\d+)([-+]\d+)?$/;
  const match = formula.match(diceRegex);
  
  if (!match) {
    return {
      total: 0,
      rolls: [],
      formula: formula,
      error: 'Неверный формат. Используйте формат XdY+Z или XdY-Z'
    };
  }
  
  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  
  // Проверяем ограничения
  if (count < 1 || count > 100) {
    return {
      total: 0,
      rolls: [],
      formula: formula,
      error: 'Количество кубов должно быть от 1 до 100'
    };
  }
  
  if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) {
    return {
      total: 0,
      rolls: [],
      formula: formula,
      error: 'Поддерживаются только кубы d4, d6, d8, d10, d12, d20 и d100'
    };
  }
  
  // Выполняем бросок
  const { total, rolls } = rollDice(count, sides);
  
  return {
    total: total + modifier,
    rolls,
    formula: `${count}d${sides}${modifier >= 0 ? '+' + modifier : modifier}`,
    error: null
  };
}

/**
 * Инициализирует функционал броска кубиков
 * @param {HTMLElement} modal - элемент модального окна
 * @param {HTMLElement} modalContent - элемент содержимого модального окна
 */
function initDiceRoller(modal, modalContent) {
  const diceTypes = [4, 6, 8, 10, 12, 20, 100];
  
  // Создаем форму для броска кубов
  const form = document.createElement('form');
  form.id = 'diceRollForm';
  form.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; gap: 12px; align-items: flex-end;">
        <div>
          <label for="diceCount">Количество кубов:</label>
          <input type="number" id="diceCount" min="1" max="100" value="1">
        </div>
        <div>
          <label for="diceSides">Тип кубика:</label>
          <select id="diceSides">
            ${diceTypes.map(sides => `<option value="${sides}">d${sides}</option>`).join('')}
          </select>
        </div>
        <div>
          <label for="diceModifier">Модификатор:</label>
          <input type="number" id="diceModifier" value="0">
        </div>
        <button type="submit">Бросить</button>
      </div>
      <div style="display: flex; gap: 12px; align-items: flex-end;">
        <div style="flex-grow: 1;">
          <label for="diceFormula">Формула броска:</label>
          <input type="text" id="diceFormula" placeholder="Например: 2d6+3" style="width: 100%;">
        </div>
        <button type="button" id="rollFormulaBtn">Бросить по формуле</button>
      </div>
    </div>
    <div id="diceRollResults"></div>
    <div class="modal-actions" style="display: flex; justify-content: flex-end; margin-top: 24px;">
      <button id="modalCloseBtn" type="button">Закрыть</button>
    </div>
  `;
  
  modalContent.innerHTML = '';
  modalContent.appendChild(form);
  
  const resultsDiv = form.querySelector('#diceRollResults');
  const formulaInput = form.querySelector('#diceFormula');
  const rollFormulaBtn = form.querySelector('#rollFormulaBtn');
  
  // Функция для отображения результата броска
  function displayRollResult(total, rolls, formula = null, error = null) {
    const result = document.createElement('div');
    result.style.marginTop = '12px';
    result.style.padding = '8px';
    result.style.borderRadius = '4px';
    result.style.backgroundColor = error ? 'var(--error-bg, #ffebee)' : 'var(--note-bg)';
    
    if (error) {
      result.innerHTML = `
        <div style="color: var(--error-color, #c62828);">
          ${error}
        </div>
      `;
    } else {
      result.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">
          ${formula || `${rolls.length}d${rolls.length ? total/rolls.length : '?'}`}: ${total}
        </div>
        <div style="font-family: monospace; color: var(--text-color);">
          [${rolls.join(', ')}]
        </div>
      `;
    }
    
    resultsDiv.insertBefore(result, resultsDiv.firstChild);
    
    // Ограничиваем количество отображаемых результатов
    if (resultsDiv.children.length > 10) {
      resultsDiv.lastChild.remove();
    }
  }
  
  // Обработчик обычного броска
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const count = parseInt(form.querySelector('#diceCount').value, 10);
    const sides = parseInt(form.querySelector('#diceSides').value, 10);
    const modifier = parseInt(form.querySelector('#diceModifier').value, 10) || 0;
    
    if (count < 1 || count > 100) {
      displayRollResult(0, [], null, 'Количество кубов должно быть от 1 до 100');
      return;
    }
    
    const { total, rolls } = rollDice(count, sides);
    displayRollResult(total + modifier, rolls, `${count}d${sides}${modifier >= 0 ? '+' + modifier : modifier}`);
  });
  
  // Обработчик броска по формуле
  rollFormulaBtn.addEventListener('click', () => {
    const formula = formulaInput.value.trim();
    if (!formula) {
      displayRollResult(0, [], null, 'Введите формулу броска');
      return;
    }
    
    const result = parseAndRoll(formula);
    if (result.error) {
      displayRollResult(0, [], result.formula, result.error);
    } else {
      displayRollResult(result.total, result.rolls, result.formula);
    }
  });
  
  // Добавляем обработчик Enter для поля формулы
  formulaInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      rollFormulaBtn.click();
    }
  });
  
  // Добавляю обработчик закрытия
  const closeBtn = form.querySelector('#modalCloseBtn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      // Закрываем ближайший .fantasy-modal
      const modalEl = modal.closest('.fantasy-modal') || modal;
      modalEl.classList.remove('active');
      // Enable resetZoomBtn when modal is closed
      const resetZoomBtn = document.getElementById('resetZoomBtn');
      if (resetZoomBtn) {
        resetZoomBtn.disabled = false;
        resetZoomBtn.style.pointerEvents = 'auto';
        resetZoomBtn.style.opacity = '1';
      }
    };
  }
  // Делегирование на modalContent (на случай динамики)
  modalContent.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'modalCloseBtn') {
      const modalEl = modal.closest('.fantasy-modal') || modal;
      modalEl.classList.remove('active');
      // Enable resetZoomBtn when modal is closed
      const resetZoomBtn = document.getElementById('resetZoomBtn');
      if (resetZoomBtn) {
        resetZoomBtn.disabled = false;
        resetZoomBtn.style.pointerEvents = 'auto';
        resetZoomBtn.style.opacity = '1';
      }
    }
  });
}

/**
 * Показывает модальное окно с функционалом броска кубиков
 * @param {HTMLElement} modal - элемент модального окна
 * @param {HTMLElement} modalHeader - элемент заголовка модального окна
 * @param {HTMLElement} modalContent - элемент содержимого модального окна
 */
export function showDiceRoller(modal, modalHeader, modalContent) {
  modalHeader.textContent = 'Бросок кубиков';
  modal.classList.add('active');
  initDiceRoller(modal, modalContent);
  
  // Disable resetZoomBtn when modal is active
  const resetZoomBtn = document.getElementById('resetZoomBtn');
  if (resetZoomBtn) {
    resetZoomBtn.disabled = true;
    resetZoomBtn.style.pointerEvents = 'none'; // Make it non-clickable
    resetZoomBtn.style.opacity = '0.5'; // Visually indicate it's disabled
  }

  // Добавляем обработчик закрытия
  const closeBtn = modal.querySelector('#modalCloseBtn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.remove('active');
      // Enable resetZoomBtn when modal is closed
      if (resetZoomBtn) {
        resetZoomBtn.disabled = false;
        resetZoomBtn.style.pointerEvents = 'auto';
        resetZoomBtn.style.opacity = '1';
      }
    };
  }
} 