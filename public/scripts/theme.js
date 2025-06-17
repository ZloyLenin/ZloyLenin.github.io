// Функция для работы с cookie
function setCookie(name, value, days = 365) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Theme switching functionality
const THEME_CHANNEL = 'theme_channel';
const channel = new BroadcastChannel(THEME_CHANNEL);

// SVG icons for theme
const moonSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z" fill="currentColor"/>
</svg>`;

const sunSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="5" fill="currentColor"/>
  <g stroke="currentColor" stroke-width="2">
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </g>
</svg>`;

// Theme management functions
export function setTheme(theme) {
  // Set theme on html element
  document.documentElement.setAttribute('data-theme', theme);
  
  // Save to localStorage
  localStorage.setItem('theme', theme);
  
  // Broadcast theme change
  channel.postMessage({ theme });

  // Update theme icon
  updateThemeIcon(theme);
}

export function updateThemeIcon(theme) {
  console.log('updateThemeIcon called with theme:', theme);
  const themeBtns = document.querySelectorAll('.theme-toggle');
  console.log('Found theme toggle buttons:', themeBtns.length);
  themeBtns.forEach(btn => {
    const iconSpan = btn.querySelector('.theme-icon');
    if (iconSpan) {
      console.log('Found theme icon span for button:', btn);
      iconSpan.innerHTML = theme === 'dark' ? moonSVG : sunSVG;
      console.log('Set innerHTML of theme icon span.');
    } else {
      console.log('Theme icon span not found for button:', btn);
    }
  });
}

// Theme toggle function
export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// Initialize theme
export function initTheme() {
  // For auth page, always use light theme
  // if (window.location.pathname.includes('auth.html')) {
  //   setTheme('light');
  //   return;
  // }
  
  // For other pages, load saved theme or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtns = document.querySelectorAll('.theme-toggle');
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
});