// Variante « premium » (bleu nuit & or) du tableau de bord Bibliothèque.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBook, FaBookOpen, FaExclamationTriangle, FaBell, FaSearch, FaPlus,
  FaBarcode, FaCheck,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, Kpi, KpiGrid, Panel, Empty, Row,
  Pill, GOLD, TEAL, BLUE, RED, PURPLE, initialsOf,
} from '../premium/kit';

const isRetard = (e) => e.dateRetourPrevue && new Date(e.dateRetourPrevue) < new Date();
const frDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const nomEtu = (x) => [x.etudiantPrenom, x.etudiantNom].filter(Boolean).join(' ') || '—';

export default function BibliothequeDashboardPremium({
  user, stats = {}, emprunts = [], reservations = [], livres = [], onOpenAjout,
}) {
  const [tab, setTab] = useState('emprunts');
  const [q, setQ] = useState('');
  const ql = q.toLowerCase();

  const retards = emprunts.filter(isRetard);
  const empruntsFiltres = emprunts.filter((e) =>
    !q || (e.livreTitre || '').toLowerCase().includes(ql) || nomEtu(e).toLowerCase().includes(ql));
  const livresFiltres = livres.filter((l) =>
    !q || (l.titre || '').toLowerCase().includes(ql) || (l.auteur || '').toLowerCase().includes(ql));

  const TABS = [
    ['emprunts', `Emprunts (${empruntsFiltres.length})`],
    ['livres', 'Catalogue'],
    ['retards', `Retards (${retards.length})`],
    ['reservations', `Réservations (${reservations.length})`],
  ];

  return (
    <PremiumPage>
      <PremiumHeader
        initials={initialsOf(user?.prenom || 'Bibliothèque', user?.nom || 'B')}
        eyebrow="Bibliothèque"
        title="Fonds documentaire"
        subtitle={`Bonjour ${user?.prenom || 'Bibliothécaire'} — gestion des emprunts et du catalogue`}
        badges={
          <>
            <Link to="/bibliothecaire/gestion-emprunts" className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-primary/25 tw-bg-primary/10 tw-px-4 tw-text-sm tw-font-semibold tw-text-primary hover:tw-bg-primary/15">
              <FaBarcode /> Gérer les emprunts
            </Link>
            {onOpenAjout && (
              <button type="button" onClick={onOpenAjout} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold hover:tw-brightness-105">
                <FaPlus /> Nouveau livre
              </button>
            )}
          </>
        }
      />

      <KpiGrid>
        <Kpi icon={FaBook} label="Total livres" value={stats.totalLivres ?? livres.length} tone={BLUE} delay={0} />
        <Kpi icon={FaBookOpen} label="Emprunts en cours" value={stats.totalEmpruntsEnCours ?? emprunts.length} tone={TEAL} delay={70} />
        <Kpi icon={FaExclamationTriangle} label="Retards" value={retards.length} tone={retards.length > 0 ? RED : TEAL} delay={140} />
        <Kpi icon={FaBell} label="Réservations" value={stats.totalReservations ?? reservations.length} tone={GOLD} delay={210} />
      </KpiGrid>

      {/* Tabs + recherche */}
      <div className="tw-mt-5 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-rounded-xl tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-1.5">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`tw-rounded-lg tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-transition ${tab === id ? 'tw-bg-primary tw-text-primary-foreground tw-shadow-gold' : 'tw-text-muted-foreground hover:tw-text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="tw-relative tw-w-full sm:tw-w-72">
          <FaSearch className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === 'livres' ? 'Titre, auteur…' : 'Rechercher…'}
            className="tw-h-10 tw-w-full tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-pl-9 tw-pr-3 tw-text-sm tw-text-foreground tw-outline-none focus:tw-border-primary/40"
          />
        </div>
      </div>

      <div className="tw-mt-4">
        {tab === 'emprunts' && (
          <Panel title="Emprunts en cours" icon={FaBookOpen} subtitle="Le retour est effectué par l'étudiant depuis son compte">
            {empruntsFiltres.length === 0 ? (
              <Empty>Aucun emprunt en cours.</Empty>
            ) : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {empruntsFiltres.map((e, i) => {
                  const r = isRetard(e);
                  return (
                    <Row
                      key={e.id || i}
                      icon={FaBook}
                      iconTone={r ? RED : BLUE}
                      title={`${e.livreTitre || '—'}`}
                      subtitle={`${nomEtu(e)}${e.etudiantMatricule ? ` (${e.etudiantMatricule})` : ''} · emprunté le ${frDate(e.dateEmprunt)}`}
                      right={<Pill tone={r ? RED : TEAL}>{r ? `Retard · ${frDate(e.dateRetourPrevue)}` : `Retour ${frDate(e.dateRetourPrevue)}`}</Pill>}
                    />
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {tab === 'livres' && (
          <Panel title="Catalogue" icon={FaBook}>
            {livresFiltres.length === 0 ? (
              <Empty>Aucun livre trouvé.</Empty>
            ) : (
              <div className="tw-grid tw-grid-cols-1 tw-gap-2.5 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
                {livresFiltres.map((l, i) => {
                  const dispo = l.quantiteDisponible ?? l.quantiteTotale ?? 1;
                  return (
                    <div key={i} className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                      <span className="tw-grid tw-h-14 tw-w-10 tw-shrink-0 tw-place-items-center tw-rounded tw-bg-gradient-to-br tw-from-primary/80 tw-to-[hsl(222,47%,14%)]"><FaBook className="tw-text-[hsl(222,47%,10%)]" /></span>
                      <div className="tw-min-w-0 tw-flex-1">
                        <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{l.titre || '—'}</p>
                        <p className="tw-truncate tw-text-xs tw-text-muted-foreground">{l.auteur || '—'}</p>
                        <div className="tw-mt-1.5 tw-flex tw-flex-wrap tw-gap-1.5">
                          {l.categorie && <Pill tone={BLUE}>{l.categorie}</Pill>}
                          <Pill tone={dispo > 0 ? TEAL : RED}>{dispo} dispo.</Pill>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {tab === 'retards' && (
          <Panel title="Retards" icon={FaExclamationTriangle}>
            {retards.length === 0 ? (
              <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-py-8 tw-text-sm tw-text-muted-foreground">
                <FaCheck style={{ color: TEAL, fontSize: 28 }} /> Tout est à jour — aucun retard.
              </div>
            ) : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {retards.map((e, i) => {
                  const jours = Math.floor((Date.now() - new Date(e.dateRetourPrevue)) / 86400000);
                  return (
                    <Row
                      key={e.id || i}
                      icon={FaExclamationTriangle}
                      iconTone={RED}
                      title={`${e.livreTitre || `Emprunt #${e.id}`}`}
                      subtitle={`Échéance ${frDate(e.dateRetourPrevue)} · ${nomEtu(e)}`}
                      right={<Pill tone={RED}>{jours} jour{jours > 1 ? 's' : ''}</Pill>}
                    />
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {tab === 'reservations' && (
          <Panel title="Réservations" icon={FaBell}>
            {reservations.length === 0 ? (
              <Empty>Aucune réservation.</Empty>
            ) : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {reservations.map((r, i) => (
                  <Row
                    key={r.id || i}
                    icon={FaBell}
                    iconTone={PURPLE}
                    title={`${r.livreTitre || '—'}`}
                    subtitle={`${nomEtu(r)} · réservé le ${frDate(r.dateReservation)} · expire ${frDate(r.dateExpiration)}`}
                    right={<Pill tone={BLUE}>{r.statut}</Pill>}
                  />
                ))}
              </div>
            )}
          </Panel>
        )}
      </div>
    </PremiumPage>
  );
}
