
import React from 'react';

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2rem',
      background: 'linear-gradient(120deg, #181c20 0%, #23272f 100%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      Hello ModernReader
    </div>
  );
}

// TopNav 已不使用（Link/useLocation），如需 React Router 請改用 react-router-dom 版本

// ...existing code...

const NavItem: React.FC<{ href: string; label: string; isActive: boolean; children: React.ReactNode }> = ({ href, label, isActive, children }) => (
    <a 
      href={href} 
      className={`
                relative flex flex-col md:flex-row items-center justify-center 
                h-16 w-16 md:h-12 md:w-12 
                mt-0 mb-0 md:mt-2 md:mb-2 mx-auto 
        bg-gray-800 hover:bg-purple-600 
        text-gray-400 hover:text-white
                rounded-2xl md:rounded-3xl hover:rounded-xl 
        transition-all duration-300 ease-linear
        group
        ${isActive ? '!bg-purple-600 !text-white !rounded-xl' : ''}
      `}
    >
      {children}
            {/* Tooltip - 只在桌面顯示 */}
            <span className="hidden md:block absolute w-auto p-2 m-2 min-w-max left-14 rounded-md shadow-md text-white bg-gray-900 text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100">
        {label}
      </span>
            {/* 手機版標籤 */}
            <span className="md:hidden text-[10px] mt-1 font-medium">
                {label.split(' ')[0]}
            </span>
    </a>
);

const Sidebar: React.FC<{ activeRoute: Route; }> = ({ activeRoute }) => (
    <div className="fixed md:top-0 md:left-0 md:h-screen md:w-[var(--sidebar-width)] md:flex-col md:border-r 
                    bottom-0 left-0 right-0 h-16 w-full flex-row border-t
                    flex bg-gray-900 text-white shadow-lg border-gray-800 z-50">
        {/* Logo - 只在桌面顯示 */}
        <div className="hidden md:flex items-center justify-center h-16 w-full">
          <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.78-2.75 9.566-1.74 2.786-4.75 2.786-6.5 0C1.009 17.78 0 14.517 0 11c0-3.517 1.009-6.78 2.75-9.566C4.49 -1.352 7.5-1.352 9.25 1.434 10.991 4.22 12 7.483 12 11zm12 0c0 3.517-1.009 6.78-2.75 9.566-1.74 2.786-4.75 2.786-6.5 0-1.74-2.786-2.75-6.05-2.75-9.566s1.01-6.78 2.75-9.566c1.74-2.786 4.75-2.786 6.5 0 1.74 2.786 2.75 6.05 2.75 9.566z" />
          </svg>
        </div>
        {/* Navigation Items */}
        <div className="flex md:flex-col flex-row flex-grow md:flex-grow justify-around md:justify-start">
            <NavItem href="#/dashboard" label="Dashboard" isActive={activeRoute === 'dashboard'}>
                <DashboardIcon className="h-6 w-6" />
            </NavItem>
            <NavItem href="#/reader" label="Reader Studio" isActive={activeRoute === 'reader'}>
                <ReaderIcon className="h-6 w-6" />
            </NavItem>
            <NavItem href="#/immersive" label="Immersive" isActive={activeRoute === 'immersive'}>
                <ReaderIcon className="h-6 w-6" />
            </NavItem>
            <NavItem href="#/sql" label="SQL Explorer" isActive={activeRoute === 'sql'}>
                <SQLIcon className="h-6 w-6" />
            </NavItem>
            <NavItem href="#/settings" label="Settings" isActive={activeRoute === 'settings'}>
                <SettingsIcon className="h-6 w-6" />
            </NavItem>
        </div>
    </div>
);

const routes: Record<string, Route> = {
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/reader': 'reader',
    '/settings': 'settings',
    '/sql': 'sql',
    '/immersive': 'immersive',
};

const pages = (theme: typeof themes.light | typeof themes.dark): Record<Route, React.ReactNode> => ({
    dashboard: <Dashboard />, 
    reader: <Reader />, 
    settings: <Settings theme={theme} />,
    sql: <SQLExplorer theme={theme} />, 
    immersive: <Immersive />,
});

export default function App() {
    const [activeRoute, setActiveRoute] = useState<Route>('dashboard');
    const [showStatus, setShowStatus] = useState<boolean>(() => {
        try {
            if (import.meta.env.VITE_SHOW_STATUS === 'true') return true;
        } catch {}
        const ls = localStorage.getItem('SHOW_STATUS');
        return ls === '1' || ls === 'true';
    });
    const { theme, mode, cycleMode } = useThemeMode();
    const [showShortcutHelp, setShowShortcutHelp] = useState(false);

    // 對外暴露 showStatus 到全域讓 Settings 能存取
    useEffect(() => {
        (window as any).__MR_showStatus = showStatus;
        (window as any).__MR_setShowStatus = setShowStatus;
    }, [showStatus]);

    console.log('🎨 App component rendering, theme:', theme);
    console.log('🧭 Active route:', activeRoute);

    useEffect(() => {
        console.log('📍 Setting up hash change listener');
        const handleHashChange = () => {
            const hash = window.location.hash.substring(1) || '/';
            console.log('🔗 Hash changed to:', hash);
            setActiveRoute(routes[hash] || 'dashboard');
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial load

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // 根據路由更新文件標題
    useEffect(() => {
        const titleMap: Record<Route, string> = {
            dashboard: 'MR | Dashboard',
            reader: 'MR | Reader Studio',
            immersive: 'MR | Immersive',
            sql: 'MR | SQL Explorer',
            settings: 'MR | Settings',
        };
        document.title = titleMap[activeRoute] || 'MR | 世界級 AI 知識閱讀平台';
    }, [activeRoute]);

    // 鍵盤快捷鍵：1..5 導航、S 顯示/隱藏狀態列、T 切換主題、? 顯示快捷鍵面板
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target && (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
            
            // ESC 關閉快捷鍵面板
            if (e.key === 'Escape' && showShortcutHelp) {
                setShowShortcutHelp(false);
                return;
            }
            
            // ? 開關快捷鍵面板
            if (e.key === '?') {
                setShowShortcutHelp(v => !v);
                return;
            }
            
            if (e.key >= '1' && e.key <= '5') {
                const map: Record<string, string> = {
                    '1': '#/dashboard', '2': '#/reader', '3': '#/immersive', '4': '#/sql', '5': '#/settings'
                };
                window.location.hash = map[e.key];
            } else if (e.key.toLowerCase() === 's') {
                setShowStatus(v => {
                    const next = !v; localStorage.setItem('SHOW_STATUS', next ? '1' : '0'); return next;
                });
            } else if (e.key.toLowerCase() === 't') {
                cycleMode();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [cycleMode, showShortcutHelp]);

    console.log('✨ Rendering App with route:', activeRoute);

    return (
        <div className="flex" style={{ background: theme.background, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
            <Sidebar activeRoute={activeRoute} />
            <main className="flex-grow min-h-screen page-container">
                {showStatus && <ServiceStatus />}
                {/* 浮動主題切換（右下角），循環：light → dark → system */}
                <button
                    onClick={cycleMode}
                    title={`Theme: ${mode}`}
                    className="fixed bottom-5 right-5 z-40 px-3 py-2 rounded-full text-xs font-semibold bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 shadow-lg"
                    aria-label="Toggle theme"
                >
                    Theme: {mode}
                </button>
                {/* 快捷鍵提示按鈕（右下角，主題按鈕上方） */}
                <button
                    onClick={() => setShowShortcutHelp(true)}
                    title="Keyboard Shortcuts (?)"
                    className="fixed bottom-16 right-5 z-40 px-3 py-2 rounded-full text-xs font-semibold bg-purple-600 text-white border border-purple-500 hover:bg-purple-700 shadow-lg"
                    aria-label="Show keyboard shortcuts"
                >
                    ⌨️ ?
                </button>
                <div className="page-transition">
                    {pages(theme)[activeRoute]}
                </div>
            </main>
            {/* 快捷鍵提示面板 */}
            <ShortcutHelp isOpen={showShortcutHelp} onClose={() => setShowShortcutHelp(false)} />
        </div>
    );
}
