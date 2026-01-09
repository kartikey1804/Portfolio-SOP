// public/js/theme-switcher.js

(function() {
  const THEME_STORAGE_KEY = 'theme-preference';
  const htmlElement = document.documentElement;

  // Helper to safely interact with localStorage
  function safeLocalStorage(action, key, value = null) {
    try {
      if (action === 'set') {
        localStorage.setItem(key, value);
        return true;
      } else if (action === 'get') {
        return localStorage.getItem(key);
      } else if (action === 'remove') {
        localStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      console.error('localStorage operation failed:', e);
      // Fallback or notify user about storage issues
      return null;
    }
    return null;
  }

  // Determine the user's system preference
  function getPreferredColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Apply the theme to the appropriate element
  function applyTheme(theme) {
    const bodyElement = document.body;
    const htmlElement = document.documentElement;
    
    // Get the actual theme to apply
    const actualTheme = theme === 'system' ? getPreferredColorScheme() : theme;
    
    // Check if this is the admin panel (uses data-theme attribute)
    const isAdminPage = window.location.pathname.includes('admin.html') || window.location.pathname.startsWith('/admin');
    
    if (isAdminPage) {
      // Admin panel: use data-theme attribute on html element
      htmlElement.setAttribute('data-theme', actualTheme);
    } else {
      // Main site: use dark-mode class on body element
      if (actualTheme === 'dark') {
        bodyElement.classList.add('dark-mode');
      } else {
        bodyElement.classList.remove('dark-mode');
      }
    }
    
    updateThemeButtons(theme);
  }

  // Set the theme and persist it
  function setTheme(theme) {
    safeLocalStorage('set', THEME_STORAGE_KEY, theme);
    applyTheme(theme);
  }

  // Update active state of theme buttons
  function updateThemeButtons(activeTheme) {
    document.querySelectorAll('.theme-switcher button').forEach(button => {
      button.classList.remove('active');
      if (button.id === `theme-${activeTheme}`) {
        button.classList.add('active');
      } else if (activeTheme === 'system' && button.id === 'theme-system') {
        button.classList.add('active');
      }
    });
  }

  // Initialize theme on page load
  document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = safeLocalStorage('get', THEME_STORAGE_KEY);
    const initialTheme = savedTheme || 'system'; // Default to system if no preference saved
    applyTheme(initialTheme); // Apply theme without saving again

    // Add event listeners for theme buttons
    const lightBtn = document.getElementById('theme-light');
    const darkBtn = document.getElementById('theme-dark');
    const systemBtn = document.getElementById('theme-system');

    if (lightBtn) {
      lightBtn.addEventListener('click', () => {
        setTheme('light');
      });
    }

    if (darkBtn) {
      darkBtn.addEventListener('click', () => {
        setTheme('dark');
      });
    }

    if (systemBtn) {
      systemBtn.addEventListener('click', () => {
        setTheme('system');
      });
    }

    // Listen for changes in system color scheme if 'system' theme is active
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (safeLocalStorage('get', THEME_STORAGE_KEY) === 'system') {
        applyTheme('system'); // Re-apply system theme to reflect new preference
      }
    });
  });

  // Expose setTheme for potential external use if needed
  window.setTheme = setTheme;
})();
