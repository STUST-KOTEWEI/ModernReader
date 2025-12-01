import React, { useEffect } from 'react';

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { key: '1', description: 'Dashboard', category: 'Navigation' },
  { key: '2', description: 'Reader Studio', category: 'Navigation' },
  { key: '3', description: 'Immersive', category: 'Navigation' },
  { key: '4', description: 'SQL Explorer', category: 'Navigation' },
  { key: '5', description: 'Settings', category: 'Navigation' },
  { key: 'S', description: 'Toggle Service Status Bar', category: 'View' },
  { key: 'T', description: 'Cycle Theme (Light → Dark → System)', category: 'View' },
  { key: '?', description: 'Show/Hide This Help Panel', category: 'Help' },
];

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutHelp({ isOpen, onClose }: ShortcutHelpProps) {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));
  
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card, rgba(30,32,36,0.95))',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '24px',
            color: 'var(--text, #fff)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span>⌨️</span>
          <span>鍵盤快捷鍵</span>
        </h2>
        
        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--accent, #00c6ff)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {cat}
            </h3>
            {shortcuts
              .filter(s => s.category === cat)
              .map(s => (
                <div
                  key={s.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--glass, rgba(255,255,255,0.05))',
                    marginBottom: '8px'
                  }}
                >
                  <kbd
                    style={{
                      background: 'var(--accent, #00c6ff)',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      minWidth: '32px',
                      textAlign: 'center',
                      fontSize: '14px',
                      boxShadow: '0 2px 8px rgba(0,198,255,0.3)'
                    }}
                  >
                    {s.key}
                  </kbd>
                  <span
                    style={{
                      marginLeft: '16px',
                      color: 'var(--text, rgba(255,255,255,0.9))',
                      fontSize: '15px'
                    }}
                  >
                    {s.description}
                  </span>
                </div>
              ))}
          </div>
        ))}
        
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: 'var(--glass, rgba(255,255,255,0.05))',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'var(--text, rgba(255,255,255,0.7))'
          }}
        >
          💡 <strong>提示:</strong> 按 <kbd style={{ 
            background: 'var(--accent, #00c6ff)', 
            color: '#fff', 
            padding: '2px 8px', 
            borderRadius: '4px',
            fontWeight: '600'
          }}>ESC</kbd> 或點擊背景關閉此面板
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
