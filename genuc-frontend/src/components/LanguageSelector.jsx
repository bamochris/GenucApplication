import { useState, useRef, useEffect } from 'react';
import { useI18n } from '../context/i18nContext';

const FLAG_EMOJIS = { fr: '🇫🇷', en: '🇬🇧', ln: '🇨🇩', sw: '🇨🇩', ts: '🇨🇩', kg: '🇨🇩' };

export default function LanguageSelector({ compact = false }) {
  const { lang, setLang, langNames, availableLangs } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Changer de langue"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: compact ? '4px 8px' : '6px 12px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 6,
          color: 'inherit',
          cursor: 'pointer',
          fontSize: compact ? 12 : 13,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 16 }}>{FLAG_EMOJIS[lang]}</span>
        {!compact && <span>{langNames[lang]}</span>}
        <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid #ddd',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 9999,
          minWidth: 160,
          overflow: 'hidden',
        }}>
          {availableLangs.map(code => (
            <button
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                background: lang === code ? 'var(--bg-secondary)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text-primary)',
                textAlign: 'left',
                fontWeight: lang === code ? 600 : 400,
              }}
            >
              <span style={{ fontSize: 18 }}>{FLAG_EMOJIS[code]}</span>
              <span>{langNames[code]}</span>
              {lang === code && <span style={{ marginLeft: 'auto', color: '#185FA5' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
