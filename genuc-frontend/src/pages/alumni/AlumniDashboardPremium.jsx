// Variante « premium » (bleu nuit & or) du tableau de bord Alumni.
import { useState } from 'react';
import { FaQrcode, FaBriefcase, FaLinkedin, FaDownload, FaTimes } from 'react-icons/fa';
import { PremiumPage, Panel, Empty, GOLD, TEAL, BLUE, alpha } from '../premium/kit';

const TABS = ['profil', 'reseau', 'offres'];

function ProInput({ label, value, placeholder }) {
  return (
    <div>
      <label className="tw-mb-1 tw-block tw-text-xs tw-text-muted-foreground">{label}</label>
      <input
        defaultValue={value || ''}
        placeholder={placeholder}
        className="tw-w-full tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-2 tw-text-sm tw-text-foreground tw-outline-none focus:tw-border-primary/40"
      />
    </div>
  );
}

export default function AlumniDashboardPremium({
  user, profil, reseau = [], offres = [], candidatures = {},
  qrDiplome, qrError, onPostuler, onGenererQR, onCloseQr, onClearQrError,
}) {
  const [tab, setTab] = useState('profil');
  const tabLabels = {
    profil: 'Mon profil',
    reseau: `Réseau Alumni (${reseau.length})`,
    offres: `Offres ciblées (${offres.length})`,
  };

  return (
    <PremiumPage>
      {qrError && (
        <div className="tw-mb-4 tw-cursor-pointer tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: alpha('hsl(0 72% 55%)', 0.3), background: alpha('hsl(0 72% 55%)', 0.1), color: 'hsl(0 80% 78%)' }} onClick={onClearQrError}>
          {qrError}
        </div>
      )}

      {/* Hero */}
      <div className="tw-mb-6 tw-flex tw-flex-wrap tw-items-center tw-gap-5 tw-overflow-hidden tw-rounded-2xl tw-p-7 tw-shadow-glass tw-animate-gu-fade-up" style={{ background: 'linear-gradient(135deg, hsl(222 47% 12%) 0%, hsl(213 65% 22%) 100%)', border: '1px solid hsl(210 40% 92% / 0.08)' }}>
        <span className="tw-grid tw-h-20 tw-w-20 tw-shrink-0 tw-place-items-center tw-rounded-full tw-bg-gradient-to-br tw-from-primary tw-to-[hsl(38,80%,48%)] tw-text-2xl tw-font-extrabold tw-text-[hsl(222,47%,10%)] tw-shadow-gold">
          {(user?.prenom?.[0] || '')}{(user?.nom?.[0] || '')}
        </span>
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary/90">Ancien étudiant</p>
          <h1 className="tw-text-2xl tw-font-extrabold tw-text-foreground">{user?.prenom} {user?.nom}</h1>
          <p className="tw-mt-1 tw-text-sm tw-text-muted-foreground">
            Diplômé{user?.genre === 'F' ? 'e' : ''} · {profil?.promotion || '—'} | {profil?.filiere || '—'}
          </p>
          <p className="tw-text-xs tw-text-muted-foreground/80">{profil?.universite || ''}</p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2.5">
          <button type="button" onClick={onGenererQR} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-primary/25 tw-bg-primary/10 tw-px-4 tw-text-sm tw-font-semibold tw-text-primary hover:tw-bg-primary/15">
            <FaQrcode /> Diplôme numérique
          </button>
          {profil?.posteActuel && (
            <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold" style={{ background: alpha(TEAL, 0.16), color: TEAL }}>
              <FaBriefcase /> {profil.posteActuel}
            </span>
          )}
        </div>
      </div>

      {/* QR modal */}
      {qrDiplome && (
        <div className="tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-center tw-justify-center tw-bg-black/70 tw-p-4">
          <div className="glass-strong tw-max-w-sm tw-rounded-2xl tw-p-8 tw-text-center">
            <h3 className="tw-mb-4 tw-text-lg tw-font-bold tw-text-foreground">Diplôme numérique vérifié</h3>
            <img src={qrDiplome} alt="QR Code diplôme" className="tw-mx-auto tw-mb-4 tw-h-48 tw-w-48 tw-rounded-lg tw-bg-white tw-p-2" />
            <p className="tw-mb-4 tw-text-xs tw-text-muted-foreground">Ce QR code permet de vérifier l'authenticité de votre diplôme.</p>
            <div className="tw-flex tw-justify-center tw-gap-2.5">
              <a href={qrDiplome} download="diplome-qr.png" className="tw-inline-flex tw-h-9 tw-items-center tw-gap-1.5 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground">
                <FaDownload /> Télécharger
              </a>
              <button type="button" onClick={onCloseQr} className="tw-inline-flex tw-h-9 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-white/15 tw-px-4 tw-text-sm tw-font-semibold tw-text-muted-foreground hover:tw-text-foreground">
                <FaTimes /> Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tw-mb-4 tw-flex tw-gap-1.5 tw-rounded-xl tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`tw-flex-1 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-transition ${tab === t ? 'tw-bg-primary tw-text-primary-foreground tw-shadow-gold' : 'tw-text-muted-foreground hover:tw-text-foreground'}`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Profil */}
      {tab === 'profil' && profil && (
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
          <Panel title="Parcours académique">
            <div className="tw-flex tw-flex-col">
              {[
                { label: 'Promotion', value: profil.promotion },
                { label: 'Filière', value: profil.filiere },
                { label: 'Mention obtenue', value: profil.mention },
                { label: 'Année de diplôme', value: profil.anneeDiplome },
                { label: 'Numéro de diplôme', value: profil.numeroDiplome },
              ].map((r) => (
                <div key={r.label} className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-white/[0.06] tw-py-2.5 tw-text-sm last:tw-border-0">
                  <span className="tw-text-muted-foreground">{r.label}</span>
                  <span className="tw-font-semibold tw-text-foreground">{r.value || '—'}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Situation professionnelle">
            <div className="tw-flex tw-flex-col tw-gap-3">
              <ProInput label="Poste actuel" value={profil.posteActuel} placeholder="ex : Ingénieur logiciel chez XYZ" />
              <ProInput label="Entreprise" value={profil.entreprise} placeholder="Nom de l'entreprise" />
              <ProInput label="LinkedIn / site pro" value={profil.linkedin} placeholder="https://linkedin.com/in/..." />
              <button type="button" disabled title="Mise à jour bientôt disponible" className="tw-mt-1 tw-w-full tw-cursor-not-allowed tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-py-2.5 tw-text-sm tw-font-semibold tw-text-muted-foreground">
                Mettre à jour mon profil
              </button>
              <p className="tw-text-xs tw-text-muted-foreground">La mise à jour de la situation professionnelle sera bientôt disponible.</p>
            </div>
          </Panel>
        </div>
      )}

      {/* Réseau */}
      {tab === 'reseau' && (
        reseau.length === 0 ? (
          <Panel><Empty>Aucun ancien étudiant dans votre réseau.</Empty></Panel>
        ) : (
          <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 lg:tw-grid-cols-4">
            {reseau.map((a, i) => (
              <div key={a.id || i} className="glass tw-rounded-xl tw-p-4 tw-text-center">
                <span className="tw-mx-auto tw-mb-2.5 tw-grid tw-h-12 tw-w-12 tw-place-items-center tw-rounded-full tw-text-sm tw-font-bold" style={{ background: alpha(BLUE, 0.16), color: BLUE }}>
                  {(a.prenom?.[0] || '')}{(a.nom?.[0] || '')}
                </span>
                <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{a.prenom} {a.nom}</p>
                <p className="tw-truncate tw-text-xs tw-text-muted-foreground">{a.promotion} — {a.filiere}</p>
                {a.posteActuel && <p className="tw-mt-1 tw-truncate tw-text-xs" style={{ color: GOLD }}>{a.posteActuel}</p>}
                {a.linkedin && (
                  <a href={a.linkedin} target="_blank" rel="noopener noreferrer" className="tw-mt-2 tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold" style={{ color: BLUE }}>
                    <FaLinkedin /> LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Offres */}
      {tab === 'offres' && (
        offres.length === 0 ? (
          <Panel><Empty>Aucune offre pour le moment.</Empty></Panel>
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-3">
            {offres.map((o) => {
              const st = candidatures[o.id];
              return (
                <div key={o.id} className="glass tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-p-4">
                  <div className="tw-min-w-0">
                    <p className="tw-text-sm tw-font-semibold tw-text-foreground">{o.titre}</p>
                    <p className="tw-text-xs tw-text-muted-foreground">{o.entreprise} — {o.lieu}</p>
                    {o.salaire && <p className="tw-mt-0.5 tw-text-xs tw-font-semibold" style={{ color: TEAL }}>{o.salaire}</p>}
                  </div>
                  {st === 'ok' ? (
                    <span className="tw-text-xs tw-font-semibold" style={{ color: TEAL }}>✅ Candidature envoyée</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPostuler?.(o.id)}
                      disabled={st === 'loading'}
                      className="tw-inline-flex tw-h-9 tw-items-center tw-rounded-lg tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-transition disabled:tw-opacity-60"
                      style={{ background: BLUE }}
                    >
                      {st === 'loading' ? 'Envoi…' : st === 'error' ? 'Réessayer' : 'Postuler'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </PremiumPage>
  );
}
