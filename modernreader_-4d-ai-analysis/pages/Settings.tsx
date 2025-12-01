import React, { useEffect, useState } from 'react';
import { getSdBase, getTtsBase, getSttBase } from '../services/configService';
import { checkSdHealth, checkTtsHealth, checkSttHealth } from '../services/healthService';
import WearableDeviceManager from '../components/WearableDeviceManager';

function GlassCard({ children, theme, style = {} }) {
    return (
        <div style={{
            background: theme.card,
            boxShadow: theme.shadow,
            borderRadius: 24,
            padding: '2rem',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(200,200,200,0.08)',
            ...style
        }}>
            {children}
        </div>
    );
}

function Settings({ theme }) {
    const [aiModel, setAiModel] = useState('gemini-2.5-pro');
    const [voice, setVoice] = useState<string>(localStorage.getItem('voicePref') || 'zh-TW');
    const [cloudSync, setCloudSync] = useState(true);
    const [sdUrl, setSdUrl] = useState('');
    const [ttsUrl, setTtsUrl] = useState('');
    const [sttUrl, setSttUrl] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // 外觀設定
    const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
    const [showStatus, setShowStatus] = useState<boolean>(true);

    useEffect(() => {
        // 初始化顯示目前生效端點
        setSdUrl(localStorage.getItem('sdUrl') || getSdBase());
        setTtsUrl(localStorage.getItem('ttsUrl') || getTtsBase());
        setSttUrl(localStorage.getItem('sttUrl') || getSttBase());
        
        // 讀取外觀設定
        const savedTheme = (localStorage.getItem('THEME_MODE') as any) || 'system';
        setThemeMode(savedTheme);
        const savedStatus = localStorage.getItem('SHOW_STATUS') === '1' || localStorage.getItem('SHOW_STATUS') === 'true';
        setShowStatus(savedStatus);
    }, []);

    const saveEndpoints = () => {
        if (sdUrl) localStorage.setItem('sdUrl', sdUrl); else localStorage.removeItem('sdUrl');
        if (ttsUrl) localStorage.setItem('ttsUrl', ttsUrl); else localStorage.removeItem('ttsUrl');
        if (sttUrl) localStorage.setItem('sttUrl', sttUrl); else localStorage.removeItem('sttUrl');
        alert('端點已保存。重新整理頁面以套用。');
    };

    const resetEndpoints = () => {
        localStorage.removeItem('sdUrl');
        localStorage.removeItem('ttsUrl');
        localStorage.removeItem('sttUrl');
        setSdUrl(getSdBase());
        setTtsUrl(getTtsBase());
        setSttUrl(getSttBase());
    };

    const handleThemeChange = (newMode: 'light' | 'dark' | 'system') => {
        setThemeMode(newMode);
        localStorage.setItem('THEME_MODE', newMode);
        window.dispatchEvent(new Event('themechange'));
    };

    const handleStatusToggle = (checked: boolean) => {
        setShowStatus(checked);
        localStorage.setItem('SHOW_STATUS', checked ? '1' : '0');
        // 通知 App.tsx 更新
        if ((window as any).__MR_setShowStatus) {
            (window as any).__MR_setShowStatus(checked);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 穿戴裝置管理 */}
            <WearableDeviceManager />
            
            {/* 外觀設定 */}
            <GlassCard theme={theme}>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: theme.accent }}>外觀 (Appearance)</h2>
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ fontWeight: 600, color: theme.text }}>主題模式：</label>
                        <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                            {['light', 'dark', 'system'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => handleThemeChange(mode as any)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: 8,
                                        border: themeMode === mode ? '2px solid ' + theme.accent : '1px solid #444',
                                        background: themeMode === mode ? theme.accent : '#374151',
                                        color: '#fff',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {mode === 'light' ? '☀️ 淺色' : mode === 'dark' ? '🌙 深色' : '⚙️ 跟隨系統'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={{ fontWeight: 600, color: theme.text }}>顯示服務狀態列：</label>
                        <input 
                            type="checkbox" 
                            checked={showStatus} 
                            onChange={e => handleStatusToggle(e.target.checked)} 
                            style={{ marginLeft: 12 }} 
                        />
                        <span style={{ marginLeft: 8, color: theme.text }}>{showStatus ? '顯示' : '隱藏'}</span>
                        <p style={{ marginTop: 8, fontSize: 14, color: '#9ca3af' }}>
                            快捷鍵 <kbd style={{ padding: '2px 6px', background: '#374151', borderRadius: 4, fontWeight: 600 }}>S</kbd> 可快速切換狀態列顯示
                        </p>
                    </div>
                </div>
            </GlassCard>
            
            <GlassCard theme={theme}>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: theme.accent }}>系統設定</h2>
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ fontWeight: 600, color: theme.text }}>AI 模型選擇：</label>
                        <select value={aiModel} onChange={e => setAiModel(e.target.value)} style={{ marginLeft: 12, padding: '8px 16px', borderRadius: 8, fontSize: 16 }}>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                            <option value="gemini-2.0-pro">Gemini 2.0 Pro</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontWeight: 600, color: theme.text }}>語音/語言偏好：</label>
                        <select value={voice} onChange={e => { setVoice(e.target.value); localStorage.setItem('voicePref', e.target.value); }} style={{ marginLeft: 12, padding: '8px 16px', borderRadius: 8, fontSize: 16 }}>
                            <option value="zh-TW">繁體中文</option>
                            <option value="en-US">English</option>
                            <option value="ja-JP">日本語</option>
                            <option value="ko-KR">한국어</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontWeight: 600, color: theme.text }}>雲端同步：</label>
                        <input type="checkbox" checked={cloudSync} onChange={e => setCloudSync(e.target.checked)} style={{ marginLeft: 12 }} />
                        <span style={{ marginLeft: 8, color: theme.text }}>{cloudSync ? '已啟用' : '未啟用'}</span>
                    </div>
                </div>
            </GlassCard>
            <GlassCard theme={theme}>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: theme.accent }}>雲端儲存狀態</h3>
                <p style={{ color: theme.text, marginTop: 8 }}>Google Drive 已連線，剩餘空間：1.8TB / 2TB</p>
            </GlassCard>
            <GlassCard theme={theme}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: theme.accent }}>進階設定</h3>
                  <button onClick={() => setShowAdvanced(v => !v)} style={{ padding: '8px 12px', borderRadius: 8, background: '#374151', color: '#fff', fontWeight: 700 }}>
                    {showAdvanced ? '收合' : '展開'}
                  </button>
                </div>
                {showAdvanced && (
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    <label style={{ color: theme.text, fontWeight: 600 }}>Stable Diffusion URL</label>
                    <input value={sdUrl} onChange={e => setSdUrl(e.target.value)} placeholder="/sdapi 或 http://host:7860/sdapi" style={{ padding: 10, borderRadius: 8, border: '1px solid #444' }} />
                    <label style={{ color: theme.text, fontWeight: 600, marginTop: 8 }}>TTS API URL</label>
                    <input value={ttsUrl} onChange={e => setTtsUrl(e.target.value)} placeholder="/ttsapi 或 http://host:5002/api" style={{ padding: 10, borderRadius: 8, border: '1px solid #444' }} />
                    <label style={{ color: theme.text, fontWeight: 600, marginTop: 8 }}>STT API URL</label>
                    <input value={sttUrl} onChange={e => setSttUrl(e.target.value)} placeholder="/sttapi 或 http://host:5003/api" style={{ padding: 10, borderRadius: 8, border: '1px solid #444' }} />
                </div>
                )}
                {showAdvanced && (
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button onClick={saveEndpoints} style={{ padding: '10px 16px', borderRadius: 8, background: '#22c55e', color: '#fff', fontWeight: 700 }}>保存</button>
                    <button onClick={resetEndpoints} style={{ padding: '10px 16px', borderRadius: 8, background: '#475569', color: '#fff', fontWeight: 700 }}>重置為預設</button>
                    <button onClick={async () => {
                        const [sd, tts, stt] = await Promise.all([checkSdHealth(), checkTtsHealth(), checkSttHealth()]);
                        alert(`SD: ${sd.ok ? 'OK' : 'NG'}${sd.message ? ' (' + sd.message + ')' : ''}\nTTS: ${tts.ok ? 'OK' : 'NG'}${tts.message ? ' (' + tts.message + ')' : ''}\nSTT: ${stt.ok ? 'OK' : 'NG'}${stt.message ? ' (' + stt.message + ')' : ''}`);
                    }} style={{ padding: '10px 16px', borderRadius: 8, background: '#0ea5e9', color: '#fff', fontWeight: 700 }}>連線測試</button>
                </div>
                )}
            </GlassCard>
        </div>
    );
}

export default Settings;
