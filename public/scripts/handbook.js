// Handbook content data
export const handbookData = {
  basics: {
    title: 'Основы',
    icon: 'fa-dice-d20',
    content: `<h3 class='fantasy-section-title'>Основы игры</h3>
          <p>В этом разделе вы найдете базовые понятия, термимы и структуру игры. Здесь описаны основные механики, роли игроков и ведущего, а также советы для новичков.</p>
          <ul>
            <li>Что такое ролевая игра?</li>
            <li>Роли: игроки и мастер</li>
            <li>Кубики и броски</li>
            <li>Основные атрибуты персонажа</li>
          </ul>`
  },
  rules: {
    title: 'Правила',
    icon: 'fa-book',
    content: `<h3 class='fantasy-section-title'>Правила</h3>
          <p>Здесь собраны основные правила, по которым ведется игра: порядок ходов, проверки, боевые действия, взаимодействие с окружением и многое другое.</p>
          <ul>
            <li>Порядок хода</li>
            <li>Проверки навыков</li>
            <li>Бой и инициатива</li>
            <li>Смерть и спасброски</li>
          </ul>`
  },
  magic: {
    title: 'Магия',
    icon: 'fa-hat-wizard',
    content: `<h3 class='fantasy-section-title'>Магия</h3>
          <p>В этом разделе описаны магические классы, заклинания, правила сотворения магии и взаимодействия с магическими предметами.</p>
          <ul>
            <li>Классы заклинателей</li>
            <li>Механика заклинаний</li>
            <li>Школы магии</li>
            <li>Магические предметы</li>
          </ul>`
  },
  equipment: {
    title: 'Снаряжение',
    icon: 'fa-shield-alt',
    content: `<h3 class='fantasy-section-title'>Снаряжение</h3>
          <p>Описание оружия, брони, инструментов, расходников и других предметов, которые могут пригодиться в приключениях.</p>
          <ul>
            <li>Оружие</li>
            <li>Доспехи</li>
            <li>Инструменты</li>
            <li>Расходники</li>
          </ul>`
  },
  creatures: {
    title: 'Существа',
    icon: 'fa-dragon',
    content: `<h3 class='fantasy-section-title'>Существа</h3>
          <p>Справочник по монстрам, животным и другим существам, встречающимся в мире игры.</p>
          <ul>
            <li>Монстры</li>
            <li>Животные</li>
            <li>Магические существа</li>
            <li>NPC и их роли</li>
          </ul>`
  }
};

// Render content by category
export function renderHandbookContent(category) {
  const data = handbookData[category];
  const contentDiv = document.getElementById('handbookContent');
  if (!data) {
    contentDiv.innerHTML = '<p>Раздел не найден.</p>';
    return;
  }
  contentDiv.innerHTML = `
    <h2 class="fantasy-board-title"><i class="fa-solid ${data.icon}"></i> ${data.title}</h2>
    <div class="fantasy-handbook-section">${data.content}</div>
  `;
}

// Initialize handbook page elements and listeners
export function initHandbookPage() {
  renderHandbookContent('basics');
  const cats = document.querySelectorAll('#handbookCategories .fantasy-board-item');
  cats.forEach(cat => {
    cat.addEventListener('click', function() {
      cats.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      renderHandbookContent(this.dataset.category);
    });
  });
  // Search functionality (simple filter)
  document.getElementById('handbookSearch').addEventListener('input', function(e) {
    const val = e.target.value.toLowerCase();
    let found = false;
    for (const key in handbookData) {
      if (
        handbookData[key].title.toLowerCase().includes(val) ||
        handbookData[key].content.toLowerCase().includes(val)
      ) {
        renderHandbookContent(key);
        document.querySelectorAll('#handbookCategories .fantasy-board-item').forEach(c => c.classList.remove('active'));
        document.querySelector(`#handbookCategories .fantasy-board-item[data-category="${key}"]`).classList.add('active');
        found = true;
        break;
      }
    }
    if (!found && val.length > 0) {
      document.getElementById('handbookContent').innerHTML = '<p>Ничего не найдено.</p>';
    }
    if (!val) {
      renderHandbookContent('basics');
      document.querySelectorAll('#handbookCategories .fantasy-board-item').forEach(c => c.classList.remove('active'));
      document.querySelector(`#handbookCategories .fantasy-board-item[data-category="basics"]`).classList.add('active');
    }
  });
}