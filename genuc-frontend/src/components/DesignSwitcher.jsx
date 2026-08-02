import { useState } from 'react';
import { useDesign } from '../context/DesignContext';

// Sélecteur de design flottant — inline-stylé pour rester lisible quel que soit
// le thème/design actif. Permet de basculer entre plusieurs designs et de
// revenir au classique à tout moment (persisté).
export default function DesignSwitcher() {
  const { design, setDesign, designs } = useDesign();
  const [open, setOpen] = useState(false);

  const panel = {
    position: 'fixed',
    right: 18,
    bottom: 18,
    zIndex: 4000,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
    fontFamily: 'Inter, system-ui, sans-serif',
  };
  const fab = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid rgba(233,185,73,0.45)',
    background: 'linear-gradient(180deg, #12203f, #0b1428)',
    color: '#f4ce7b',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6)',
  };
  const card = {
    minWidth: 210,
    padding: 8,
    borderRadius: 14,
    border: '1px solid rgba(148,163,184,0.22)',
    background: 'rgba(12,20,40,0.92)',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 20px 50px -20px rgba(0,0,0,0.7)',
  };
  const item = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '9px 10px',
    borderRadius: 10,
    border: '1px solid ' + (active ? 'rgba(233,185,73,0.5)' : 'transparent'),
    background: active ? 'rgba(233,185,73,0.14)' : 'transparent',
    color: active ? '#f4ce7b' : '#cbd5e1',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 13,
  });

  return (
    <div style={panel}>
      {open && (
        <div style={card} role="listbox" aria-label="Choix du design">
          <p style={{ margin: '4px 8px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
            Apparence
          </p>
          {designs.map((d) => {
            const active = d.id === design;
            return (
              <button
                key={d.id}
                role="option"
                aria-selected={active}
                onClick={() => setDesign(d.id)}
                style={item(active)}
              >
                <span
                  aria-hidden
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: d.id === 'premium'
                      ? 'linear-gradient(135deg,#f4ce7b,#0f2a53)'
                      : 'linear-gradient(135deg,#e5e7eb,#94a3b8)',
                  }}
                />
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 600 }}>{d.label}</span>
                  <span style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>{d.hint}</span>
                </span>
                {active && <span aria-hidden style={{ color: '#f4ce7b' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        style={fab}
        aria-expanded={open}
        title="Changer de design"
      >
        <span aria-hidden style={{ fontSize: 15 }}>🎨</span>
        Design : {designs.find((d) => d.id === design)?.label}
      </button>
    </div>
  );
}
