import { useEffect, useState } from 'react';
import { useStore } from './store.js';
import { useRoute } from './lib/router.js';
import { Icon, Toasts } from './components/ui.jsx';
import Dashboard from './components/Dashboard.jsx';
import Profile from './components/Profile.jsx';
import NewApplication from './components/NewApplication.jsx';
import Editor from './components/Editor.jsx';
import Settings from './components/Settings.jsx';
import PrintRoot from './components/PrintRoot.jsx';

export default function App() {
  const ready = useStore((s) => s.ready); const init = useStore((s) => s.init); const online = useStore((s) => s.online); const ai = useStore((s) => s.ai); const aiOn = useStore((s) => s.settings.ai);
  const theme = useStore((s) => s.settings.theme); const setSettings = useStore((s) => s.setSettings);
  const route = useRoute(); const [settings, setSettingsOpen] = useState(false);
  useEffect(() => { init(); }, [init]);
  if (!ready) return <div className="busy" style={{ position: 'static', minHeight: '100vh' }}><div className="spinner" /></div>;

  const [a, b] = route.parts; const path = a || 'home';
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  const status = !online ? ['warn', 'Offline'] : ai.ai && aiOn ? ['ai', 'AI on'] : ['ok', 'Offline ready'];
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#/"><img src="/icon.svg" alt="" /><span className="brand-name">Resume Generator Pro</span></a>
        <nav className="nav" aria-label="Main">
          <a href="#/" aria-current={path === 'home' || path === 'app' ? 'page' : undefined}><Icon name="home" width="16" height="16" /> <span>Applications</span></a>
          <a href="#/profile" aria-current={path === 'profile' || path === 'welcome' ? 'page' : undefined}><span>Profile</span></a>
        </nav>
        <span className="grow" />
        <span className={`badge hide-sm ${status[0]}`} title={online ? 'Everything works without a connection' : 'You are offline. All features still work.'}><i />{status[1]}</span>
        <button className="btn ghost icon-only" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setSettings({ theme: dark ? 'light' : 'dark' })}><Icon name={dark ? 'sun' : 'moon'} /></button>
        <button className="btn ghost icon-only" aria-label="Settings" onClick={() => setSettingsOpen(true)}><Icon name="settings" /></button>
      </header>
      {!online && <div className="offline-bar">You’re offline. Everything still works and is saved on this device.</div>}
      <main>
        {path === 'home' && <Dashboard />}
        {path === 'welcome' && <Profile onboarding />}
        {path === 'profile' && <Profile />}
        {path === 'new' && <NewApplication />}
        {path === 'app' && b && <Editor key={b} id={b} />}
        {!['home', 'welcome', 'profile', 'new', 'app'].includes(path) && <div className="page-pad"><div className="empty"><h2>Page not found</h2><a className="btn primary" href="#/">Go home</a></div></div>}
      </main>
      {settings && <Settings onClose={() => setSettingsOpen(false)} />}
      <Toasts />
      <PrintRoot />
    </>
  );
}
