import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

const STORAGE_DARK = 'dark-mode';
const STORAGE_ULTRA = 'isUltraDarkThemeEnabled';

function readBool(key: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === 'true';
}

function applyDom(isDark: boolean, isUltra: boolean) {
  document.body.classList.remove('dark', 'light');
  document.body.classList.add(isDark ? 'dark' : 'light');
  // Native scrollbars read color-scheme, not the body class.
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  if (isUltra) {
    document.documentElement.setAttribute('data-theme', 'ultra-dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  const msg = document.getElementById('message');
  if (msg) {
    msg.classList.remove('dark', 'light');
    msg.classList.add(isDark ? 'dark' : 'light');
  }
}

// module load so the document is in the right theme before React mounts.
const initialDark = readBool(STORAGE_DARK, true);
const initialUltra = readBool(STORAGE_ULTRA, false);
applyDom(initialDark, initialUltra);

// ─── Shared design tokens ──────────────────────────────────────────────────
const SHARED_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// ─── Light mode tokens ─────────────────────────────────────────────────────
const LIGHT_TOKENS = {
  colorBgBase: '#ffffff',
  colorBgLayout: '#f7f7f5',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorText: '#37352f',
  colorTextSecondary: '#6b6b6b',
  colorTextTertiary: '#9b9a97',
  colorTextPlaceholder: '#9b9a97',
  colorBorder: '#e9e9e7',
  colorBorderSecondary: '#e9e9e7',
  colorPrimary: '#2383e2',
  colorPrimaryHover: '#0b6dcb',
  colorPrimaryActive: '#0958d9',
  colorError: '#df4040',
  colorErrorText: '#df4040',
  colorSuccess: '#2d9653',
  colorSuccessText: '#2d9653',
  colorWarning: '#c08a00',
  borderRadius: 6,
  borderRadiusLG: 8,
  borderRadiusSM: 4,
  fontFamily: SHARED_FONT,
  fontSize: 14,
  lineHeight: 1.5,
  motionDurationMid: '0.15s',
  motionDurationSlow: '0.2s',
};

const LIGHT_BUTTON_TOKENS = {
  colorPrimary: '#2383e2',
  colorPrimaryHover: '#0b6dcb',
  colorPrimaryActive: '#0958d9',
  borderRadius: 6,
  borderRadiusSM: 4,
};

const LIGHT_LAYOUT_TOKENS = {
  bodyBg: '#f7f7f5',
  headerBg: '#ffffff',
  footerBg: '#f7f7f5',
  siderBg: '#f7f7f5',
};

const LIGHT_MENU_TOKENS = {
  itemBg: 'transparent',
  subMenuItemBg: 'transparent',
  popupBg: '#ffffff',
  itemSelectedBg: '#e9e9e7',
  itemSelectedColor: '#37352f',
  itemHoverBg: '#f1f1ef',
  itemHoverColor: '#37352f',
  itemColor: '#37352f',
  itemHeight: 32,
  fontSize: 14,
};

const LIGHT_TABLE_TOKENS = {
  headerBg: '#f7f7f5',
  rowHoverBg: '#f7f7f5',
  borderColor: '#e9e9e7',
};

const LIGHT_CARD_TOKENS = {
  colorBorderSecondary: '#e9e9e7',
};

// ─── Dark mode tokens ──────────────────────────────────────────────────────
const DARK_TOKENS = {
  colorBgBase: '#191919',
  colorBgLayout: '#191919',
  colorBgContainer: '#202020',
  colorBgElevated: '#2c2c2c',
  colorText: '#e6e5e3',
  colorTextSecondary: '#9b9a97',
  colorTextTertiary: '#6b6b6b',
  colorTextPlaceholder: '#6b6b6b',
  colorBorder: '#2d2d2d',
  colorBorderSecondary: '#2d2d2d',
  colorPrimary: '#5b9de1',
  colorPrimaryHover: '#7ab3e8',
  colorPrimaryActive: '#4387d0',
  colorError: '#f25757',
  colorErrorText: '#f25757',
  colorSuccess: '#3dba6f',
  colorSuccessText: '#3dba6f',
  colorWarning: '#e5a82c',
  borderRadius: 6,
  borderRadiusLG: 8,
  borderRadiusSM: 4,
  fontFamily: SHARED_FONT,
  fontSize: 14,
  lineHeight: 1.5,
  motionDurationMid: '0.15s',
  motionDurationSlow: '0.2s',
};

const DARK_LAYOUT_TOKENS = {
  bodyBg: '#191919',
  headerBg: '#191919',
  headerColor: '#e6e5e3',
  footerBg: '#191919',
  siderBg: '#191919',
  triggerBg: '#2c2c2c',
  triggerColor: '#e6e5e3',
};

const ULTRA_DARK_TOKENS = {
  colorBgBase: '#000',
  colorBgLayout: '#000',
  colorBgContainer: '#111111',
  colorBgElevated: '#1a1a1a',
  colorText: '#e6e5e3',
  colorTextSecondary: '#9b9a97',
  colorTextTertiary: '#6b6b6b',
  colorTextPlaceholder: '#6b6b6b',
  colorBorder: '#222222',
  colorBorderSecondary: '#222222',
  colorPrimary: '#5b9de1',
  colorPrimaryHover: '#7ab3e8',
  colorPrimaryActive: '#4387d0',
  colorError: '#f25757',
  colorErrorText: '#f25757',
  colorSuccess: '#3dba6f',
  colorSuccessText: '#3dba6f',
  colorWarning: '#e5a82c',
  borderRadius: 6,
  borderRadiusLG: 8,
  borderRadiusSM: 4,
  fontFamily: SHARED_FONT,
  fontSize: 14,
  lineHeight: 1.5,
};

const ULTRA_DARK_LAYOUT_TOKENS = {
  bodyBg: '#000',
  headerBg: '#050505',
  headerColor: '#e6e5e3',
  footerBg: '#000',
  siderBg: '#050505',
  triggerBg: '#1a1a1a',
  triggerColor: '#e6e5e3',
};

const DARK_MENU_TOKENS = {
  darkItemBg: 'transparent',
  darkSubMenuItemBg: 'transparent',
  darkPopupBg: '#2c2c2c',
  darkItemSelectedBg: '#2c2c2c',
  darkItemSelectedColor: '#e6e5e3',
  darkItemHoverBg: '#262626',
  darkItemHoverColor: '#e6e5e3',
  darkItemColor: '#9b9a97',
  itemHeight: 32,
  fontSize: 14,
};

const ULTRA_DARK_MENU_TOKENS = {
  darkItemBg: 'transparent',
  darkSubMenuItemBg: 'transparent',
  darkPopupBg: '#1a1a1a',
  darkItemSelectedBg: '#1a1a1a',
  darkItemSelectedColor: '#e6e5e3',
  darkItemHoverBg: '#151515',
  darkItemHoverColor: '#e6e5e3',
  darkItemColor: '#6b6b6b',
  itemHeight: 32,
  fontSize: 14,
};

const DARK_CARD_TOKENS = {
  colorBorderSecondary: '#2d2d2d',
};
const ULTRA_DARK_CARD_TOKENS = {
  colorBorderSecondary: '#222222',
};

const STATISTIC_TOKENS = {
  contentFontSize: 17,
  titleFontSize: 11,
};

// hashed:false drops the `:where(.css-<hash>)` wrapper antd puts around every
// rule. It costs nothing in specificity — `:where()` contributes zero, so the
// panel's own `.ant-*` overrides still win — and it removes roughly 5,700
// wrappers, 16% of the generated stylesheet, from what the browser has to parse.
//
// cssVar.key pins the CSS-variable scope. Every panel page mounts its own
// ConfigProvider (there is no root one), and without a fixed key each mints a
// fresh useId-derived scope, so navigating re-serialises and re-injects the whole
// token block under a new class instead of reusing the one already in the head.
const SHARED_STYLE_CONFIG = {
  hashed: false,
  cssVar: { key: 'xui' },
} as const;

export function buildAntdThemeConfig(isDark: boolean, isUltra: boolean): ThemeConfig {
  if (!isDark) {
    return {
      ...SHARED_STYLE_CONFIG,
      algorithm: antdTheme.defaultAlgorithm,
      token: LIGHT_TOKENS,
      components: {
        Layout: LIGHT_LAYOUT_TOKENS,
        Menu: LIGHT_MENU_TOKENS,
        Table: LIGHT_TABLE_TOKENS,
        Card: LIGHT_CARD_TOKENS,
        Statistic: STATISTIC_TOKENS,
        Button: LIGHT_BUTTON_TOKENS,
      },
    };
  }
  return {
    ...SHARED_STYLE_CONFIG,
    algorithm: antdTheme.darkAlgorithm,
    token: isUltra ? ULTRA_DARK_TOKENS : DARK_TOKENS,
    components: {
      Layout: isUltra ? ULTRA_DARK_LAYOUT_TOKENS : DARK_LAYOUT_TOKENS,
      Menu: isUltra ? ULTRA_DARK_MENU_TOKENS : DARK_MENU_TOKENS,
      Card: isUltra ? ULTRA_DARK_CARD_TOKENS : DARK_CARD_TOKENS,
      Statistic: STATISTIC_TOKENS,
    },
  };
}

export function pauseAnimationsUntilLeave(elementId: string): void {
  document.documentElement.setAttribute('data-theme-animations', 'off');
  const el = document.getElementById(elementId);
  if (!el) return;
  const restore = () => {
    document.documentElement.removeAttribute('data-theme-animations');
    el.removeEventListener('mouseleave', restore);
    el.removeEventListener('touchend', restore);
  };
  el.addEventListener('mouseleave', restore);
  el.addEventListener('touchend', restore);
}

interface ThemeContextValue {
  isDark: boolean;
  isUltra: boolean;
  toggleTheme: () => void;
  toggleUltra: () => void;
  antdThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(initialDark);
  const [isUltra, setIsUltra] = useState<boolean>(initialUltra);

  useLayoutEffect(() => {
    applyDom(isDark, isUltra);
    localStorage.setItem(STORAGE_DARK, String(isDark));
    localStorage.setItem(STORAGE_ULTRA, String(isUltra));
  }, [isDark, isUltra]);

  const toggleTheme = useCallback(() => setIsDark((v) => !v), []);
  const toggleUltra = useCallback(() => setIsUltra((v) => !v), []);

  const antdThemeConfig = useMemo(() => buildAntdThemeConfig(isDark, isUltra), [isDark, isUltra]);

  const value = useMemo<ThemeContextValue>(
    () => ({ isDark, isUltra, toggleTheme, toggleUltra, antdThemeConfig }),
    [isDark, isUltra, toggleTheme, toggleUltra, antdThemeConfig],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
