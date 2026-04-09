import React, { useState } from 'react';
import { Settings, Bell, Shield, Globe, Palette, Save, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Section = ({ icon: Icon, title, children }) => (
  <div className="rounded-2xl p-6" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
    <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom:'1px solid var(--border)' }}>
      <div className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background:'var(--green-bg)', border:'1px solid var(--green-border)', color:'var(--green)' }}>
        <Icon size={15} />
      </div>
      <span className="text-sm font-bold" style={{ color:'var(--text-primary)' }}>{title}</span>
    </div>
    {children}
  </div>
);

const Toggle = ({ label, sub, checked, onChange }) => (
  <div className="flex items-center justify-between py-3" style={{ borderBottom:'1px solid var(--border)' }}>
    <div>
      <div className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{sub}</div>}
    </div>
    <button onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
      style={{ background: checked ? 'var(--green)' : 'var(--border-strong)' }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: checked ? '22px' : '2px' }} />
    </button>
  </div>
);

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [prefs, setPrefs]   = useState({
    emailAlerts: true, riskNotifications: true, weeklyReport: false,
    autoTranscribe: true, financeDetection: true, languageDetection: true,
  });

  const toggle = key => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl" style={{ color:'var(--text-primary)' }}>
      <div>
        <h1 className="text-2xl font-black tracking-tight mb-1">Settings</h1>
        <p className="text-sm" style={{ color:'var(--text-muted)' }}>Manage your preferences and account configuration</p>
      </div>

      {saved && (
        <div className="text-sm font-semibold rounded-xl px-4 py-3" style={{ background:'rgba(5,150,105,0.08)', border:'1px solid rgba(5,150,105,0.2)', color:'var(--accent-green)' }}>
          ✓ Settings saved successfully.
        </div>
      )}

      {/* Appearance */}
      <Section icon={Palette} title="Appearance">
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>Theme</div>
            <div className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>Switch between light and dark mode</div>
          </div>
          <button onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)', color:'var(--text-secondary)' }}>
            {theme === 'light' ? <><Moon size={14} /> Dark Mode</> : <><Sun size={14} /> Light Mode</>}
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <Toggle label="Email Alerts" sub="Receive high-risk alerts via email" checked={prefs.emailAlerts} onChange={() => toggle('emailAlerts')} />
        <Toggle label="Risk Notifications" sub="In-app alerts for high-risk conversations" checked={prefs.riskNotifications} onChange={() => toggle('riskNotifications')} />
        <Toggle label="Weekly Report" sub="Get a weekly summary of your conversations" checked={prefs.weeklyReport} onChange={() => toggle('weeklyReport')} />
      </Section>

      {/* AI Pipeline */}
      <Section icon={Shield} title="AI Pipeline">
        <Toggle label="Auto Transcribe" sub="Automatically start transcription on upload" checked={prefs.autoTranscribe} onChange={() => toggle('autoTranscribe')} />
        <Toggle label="Finance Detection" sub="Detect financial entities and risks" checked={prefs.financeDetection} onChange={() => toggle('financeDetection')} />
        <Toggle label="Language Detection" sub="Auto-detect spoken language" checked={prefs.languageDetection} onChange={() => toggle('languageDetection')} />
      </Section>

      {/* Language */}
      <Section icon={Globe} title="Language & Region">
        <div className="flex flex-col gap-3">
          {[
            { label:'Default Language', options:['Hindi (hi)','English (en)','Tamil (ta)','Telugu (te)','Bengali (bn)','Kannada (kn)','Malayalam (ml)','Gujarati (gu)','Punjabi (pa)','Marathi (mr)'] },
            { label:'Date Format', options:['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'] },
          ].map(({ label, options }) => (
            <div key={label}>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:'var(--text-muted)' }}>{label}</label>
              <select className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold outline-none"
                style={{ background:'var(--bg-input)', border:'1px solid var(--border)', color:'var(--text-primary)' }}>
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Section>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all self-start px-8"
        style={{ background: saving ? 'var(--text-faint)' : 'var(--green)', color:'var(--text-inverse)', border:'none', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px rgba(90,158,47,0.3)' }}>
        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Settings</>}
      </button>
    </div>
  );
}

