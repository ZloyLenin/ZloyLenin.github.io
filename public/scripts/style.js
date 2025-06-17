// Global style switching module
const STYLE_CHANNEL = 'style_channel';
const STYLE_KEY = 'siteStyle';

// Initialize broadcast channel for style updates
const styleChannel = new BroadcastChannel(STYLE_CHANNEL);

// Cookie helpers
function setCookie(name, value, days = 365) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '')  + expires + '; path=/';
}

function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
    let c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

// Style management
export function getCurrentStyle() {
  return getCookie(STYLE_KEY) || 'classic';
}

// Style and theme management
export function setStyle(style) {
  // Для account.html используем #accountRoot, для остальных — document.documentElement
  const accountRoot = document.getElementById('accountRoot');
  const root = accountRoot || document.documentElement;
  root.classList.remove('fantasy-root', 'alt-root', 'classic-root', 'classic-parchment-root', 'classic-wood-root', 'classic-gold-root');
  if (style === 'alt') root.classList.add('alt-root');
  else if (style === 'classic' || style === 'fantasy') root.classList.add('fantasy-root');
  else if (style === 'classic-parchment') root.classList.add('classic-parchment-root');
  else if (style === 'classic-wood') root.classList.add('classic-wood-root');
  else if (style === 'classic-gold') root.classList.add('classic-gold-root');
  root.dataset.style = style;
  localStorage.setItem('style', style);
  styleChannel.postMessage({ style });
}

export function applyStyle(style) {
  const root = document.documentElement;
  // Для account.html используем #accountRoot, для остальных — body
  const accountRoot = document.getElementById('accountRoot');
  const allRootClasses = ['fantasy-root', 'alt-root', 'classic-parchment-root', 'classic-wood-root', 'classic-gold-root'];
  function setRootClass(el, style) {
    el.classList.remove(...allRootClasses);
    if (style === 'alt') el.classList.add('alt-root');
    else if (style === 'classic' || style === 'fantasy') el.classList.add('fantasy-root');
    else if (style === 'classic-parchment') el.classList.add('classic-parchment-root');
    else if (style === 'classic-wood') el.classList.add('classic-wood-root');
    else if (style === 'classic-gold') el.classList.add('classic-gold-root');
  }
  if (accountRoot) {
    setRootClass(accountRoot, style);
  } else {
    setRootClass(document.body, style);
  }
  root.dataset.style = style;
  updateStyleElements(style);
}

function updateStyleElements(style) {
  // Update theme toggle icon if exists
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.classList.remove('alt', 'classic');
    themeIcon.classList.add(style === 'alt' ? 'alt' : 'classic');
  }
  
  // Update any style-specific buttons or elements
  const styleElements = document.querySelectorAll('[data-style-element]');
  styleElements.forEach(el => {
    el.dataset.currentStyle = style;
  });
}

// Initialize style
export function initStyle() {
  // For auth page, always use classic style
  if (window.location.pathname.includes('auth.html')) {
    setStyle('classic');
    return;
  }
  
  // For other pages, load saved style or default to classic
  const savedStyle = localStorage.getItem('style') || 'classic';
  setStyle(savedStyle);
}

// Listen for style changes from other tabs/windows
styleChannel.addEventListener('message', (event) => {
  if (event.data.style) {
    setStyle(event.data.style);
  }
});

// Export channel for direct access if needed
export { styleChannel }; 