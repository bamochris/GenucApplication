// Variante « premium » (bleu nuit & or) du tableau de bord Bibliothécaire (console CRUD).
import { useState } from 'react';
import {
  FaBook, FaCheckCircle, FaBookOpen, FaExclamationTriangle, FaSyncAlt,
  FaPlus, FaEdit, FaTrash, FaCog, FaFolderOpen,
} from 'react-icons/fa';
import BibliothequeRecherche from '../../components/BibliothequeRecherche';
import {
  PremiumPage, PremiumHeader, Kpi, KpiGrid, Panel, Empty, Row, Pill,
  SmallButton, GOLD, TEAL, BLUE, PURPLE, RED, alpha, initialsOf,
} from '../premium/kit';

const TYPES_OUVRAGE = [
  { value: 'LIVRE', label: 'Livre' },
  { value: 'REVUE', label: 'Revue' },
  { value: 'MEMOIRE', label: 'Mémoire' },
  { value: 'THESE', label: 'Thèse' },
];

const inputCls = 'tw-w-full tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-2 tw-text-sm tw-text-foreground tw-outline-none focus:tw-border-primary/40';
const frDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const nomEtu = (x) => `${[x.etudiantPrenom, x.etudiantNom].filter(Boolean).join(' ') || '—'}${x.etudiantMatricule ? ` (${x.etudiantMatricule})` : ''}`;

function Field({ label, children }) {
  return (
    <label className="tw-flex tw-flex-col tw-gap-1">
      <span className="tw-text-xs tw-font-medium tw-text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function TabBar({ tab, setTab, tabs }) {
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-rounded-xl tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-1.5">
      {tabs.map(([id, label]) => (
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
  );
}

export default function BibliothecaireDashboardPremium(props) {
  const {
    user, stats, ouvrages = [], ouvragesAffiches = [], echeances = [], reservations = [],
    categories = [], retards = [], message, error, onClearMessage, onClearError, onRefresh,
    gestionRetardsLoading, onGererRetards, rechercheLoading, onRecherche, onResetRecherche,
    showOuvrageForm, editingOuvrage, ouvrageForm, setOuvrageForm, onOpenNouvelOuvrage,
    onOpenEditOuvrage, onSubmitOuvrage, onCloseOuvrageForm, onSupprimerOuvrage,
    showCategorieForm, categorieForm, setCategorieForm, onToggleCategorieForm,
    onSubmitCategorie, onSupprimerCategorie,
  } = props;
  const [tab, setTab] = useState('apercu');

  return (
    <PremiumPage>
      <PremiumHeader
        initials={initialsOf(user?.nomComplet || 'Bibliothécaire')}
        eyebrow="Bibliothèque"
        title="Gestion documentaire"
        subtitle={`${user?.nomComplet || 'Bibliothécaire'} · ouvrages, emprunts et catégories`}
        badges={onRefresh && (
          <button type="button" onClick={onRefresh} className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-muted-foreground hover:tw-text-foreground">
            <FaSyncAlt /> Rafraîchir
          </button>
        )}
      />

      {message && <div className="tw-mb-4 tw-cursor-pointer tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: alpha(TEAL, 0.3), background: alpha(TEAL, 0.1), color: TEAL }} onClick={onClearMessage}>{message}</div>}
      {error && <div className="tw-mb-4 tw-cursor-pointer tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: alpha(RED, 0.3), background: alpha(RED, 0.1), color: 'hsl(0 80% 78%)' }} onClick={onClearError}>{error}</div>}

      <KpiGrid>
        <Kpi icon={FaBook} label="Total ouvrages" value={stats?.totalOuvrages || 0} tone={BLUE} delay={0} />
        <Kpi icon={FaCheckCircle} label="Disponibles" value={stats?.totalDisponibles || 0} tone={TEAL} delay={70} />
        <Kpi icon={FaBookOpen} label="Emprunts en cours" value={stats?.totalEmpruntsEnCours || 0} tone={GOLD} delay={140} />
        <Kpi icon={FaExclamationTriangle} label="Retards" value={retards.length} tone={retards.length > 0 ? RED : TEAL} delay={210} />
      </KpiGrid>

      <div className="tw-mt-5">
        <TabBar tab={tab} setTab={setTab} tabs={[
          ['apercu', 'Aperçu'],
          ['ouvrages', `Catalogue (${ouvrages.length})`],
          ['emprunts', `Emprunts (${echeances.length})`],
          ['reservations', `Réservations (${reservations.length})`],
          ['categories', `Catégories (${categories.length})`],
        ]} />
      </div>

      {/* Aperçu */}
      {tab === 'apercu' && (
        <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4">
          <Panel
            title={`Emprunts en retard (${retards.length})`}
            icon={FaExclamationTriangle}
            action={onGererRetards && (
              <SmallButton tone={GOLD} icon={FaCog} onClick={onGererRetards}>
                {gestionRetardsLoading ? 'Calcul…' : 'Recalculer pénalités'}
              </SmallButton>
            )}
          >
            {retards.length === 0 ? <Empty>Aucun retard.</Empty> : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {retards.map((e, i) => {
                  const jours = Math.floor((Date.now() - new Date(e.dateRetourPrevue)) / 86400000);
                  return (
                    <Row key={e.id || i} icon={FaExclamationTriangle} iconTone={RED}
                      title={`Emprunt #${e.id}`}
                      subtitle={`Retour prévu ${frDate(e.dateRetourPrevue)}${e.penalite ? ` · ${e.penalite} FC` : ''}`}
                      right={<Pill tone={RED}>{jours} j</Pill>} />
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Derniers ouvrages ajoutés" icon={FaBook}>
            {ouvrages.length === 0 ? <Empty>Aucun ouvrage.</Empty> : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {ouvrages.slice(0, 5).map((o, i) => (
                  <Row key={o.id || i} icon={FaBook} iconTone={BLUE}
                    title={o.titre} subtitle={`${o.auteur || '—'} · ${o.typeOuvrage || ''}`}
                    right={<Pill tone={o.quantiteDisponible > 0 ? TEAL : RED}>{o.quantiteDisponible > 0 ? 'Dispo' : 'Épuisé'}</Pill>} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Catalogue */}
      {tab === 'ouvrages' && (
        <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4">
          <div className="tw-flex tw-justify-end">
            <button type="button" onClick={onOpenNouvelOuvrage} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold hover:tw-brightness-105">
              <FaPlus /> Nouvel ouvrage
            </button>
          </div>

          <BibliothequeRecherche onSearch={onRecherche} onReset={onResetRecherche} loading={rechercheLoading} />

          {showOuvrageForm && (
            <Panel title={editingOuvrage ? "Modifier l'ouvrage" : 'Ajouter un ouvrage'} icon={FaBook}>
              <form onSubmit={onSubmitOuvrage} className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2">
                <Field label="Titre *"><input className={inputCls} value={ouvrageForm.titre} onChange={(e) => setOuvrageForm({ ...ouvrageForm, titre: e.target.value })} required /></Field>
                <Field label="Auteur"><input className={inputCls} value={ouvrageForm.auteur} onChange={(e) => setOuvrageForm({ ...ouvrageForm, auteur: e.target.value })} /></Field>
                <Field label="ISBN"><input className={inputCls} value={ouvrageForm.isbn} onChange={(e) => setOuvrageForm({ ...ouvrageForm, isbn: e.target.value })} /></Field>
                <Field label="Éditeur"><input className={inputCls} value={ouvrageForm.editeur} onChange={(e) => setOuvrageForm({ ...ouvrageForm, editeur: e.target.value })} /></Field>
                <Field label="Type *">
                  <select className={inputCls} value={ouvrageForm.typeOuvrage} onChange={(e) => setOuvrageForm({ ...ouvrageForm, typeOuvrage: e.target.value })} required>
                    {TYPES_OUVRAGE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Catégorie">
                  <select className={inputCls} value={ouvrageForm.categorie} onChange={(e) => setOuvrageForm({ ...ouvrageForm, categorie: e.target.value })}>
                    <option value="">— Aucune —</option>
                    {categories.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
                  </select>
                </Field>
                <Field label="Nombre d'exemplaires"><input type="number" min="1" className={inputCls} value={ouvrageForm.quantiteTotale} onChange={(e) => setOuvrageForm({ ...ouvrageForm, quantiteTotale: e.target.value })} /></Field>
                <div className="tw-flex tw-items-end tw-gap-2.5">
                  <button type="submit" className="tw-inline-flex tw-h-10 tw-items-center tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold">{editingOuvrage ? 'Enregistrer' : "Créer l'ouvrage"}</button>
                  <button type="button" onClick={onCloseOuvrageForm} className="tw-inline-flex tw-h-10 tw-items-center tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-text-sm tw-font-semibold tw-text-muted-foreground hover:tw-text-foreground">Annuler</button>
                </div>
              </form>
            </Panel>
          )}

          <Panel title={`Catalogue (${ouvragesAffiches.length})`} icon={FaBook}>
            {ouvragesAffiches.length === 0 ? <Empty>Aucun ouvrage trouvé.</Empty> : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {ouvragesAffiches.map((o, i) => (
                  <Row key={o.id || i} icon={FaBook} iconTone={BLUE}
                    title={o.titre}
                    subtitle={`${o.auteur || '—'} · ${o.typeOuvrage || ''}${o.categorie ? ` · ${o.categorie}` : ''}`}
                    right={
                      <div className="tw-flex tw-items-center tw-gap-1.5">
                        <Pill tone={o.quantiteDisponible > 0 ? TEAL : RED}>{o.quantiteDisponible ?? 0}/{o.quantiteTotale ?? 0}</Pill>
                        <SmallButton tone={BLUE} icon={FaEdit} onClick={() => onOpenEditOuvrage(o)} title="Modifier" />
                        <SmallButton danger icon={FaTrash} onClick={() => onSupprimerOuvrage(o.id)} title="Supprimer" />
                      </div>
                    } />
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Emprunts */}
      {tab === 'emprunts' && (
        <div className="tw-mt-4">
          <Panel title={`Emprunts en cours (${echeances.length})`} icon={FaBookOpen} subtitle="Le retour est effectué par l'étudiant depuis son compte">
            {echeances.length === 0 ? <Empty>Aucun emprunt en cours.</Empty> : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {echeances.map((e, i) => {
                  const retard = e.dateRetourPrevue && new Date(e.dateRetourPrevue) < new Date();
                  return (
                    <Row key={e.id || i} icon={FaBook} iconTone={retard ? RED : BLUE}
                      title={e.livreTitre || `Emprunt #${e.id}`}
                      subtitle={`${nomEtu(e)} · emprunté le ${frDate(e.dateEmprunt)}`}
                      right={<Pill tone={retard ? RED : TEAL}>{retard ? `Retard · ${frDate(e.dateRetourPrevue)}` : `Retour ${frDate(e.dateRetourPrevue)}`}</Pill>} />
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Réservations */}
      {tab === 'reservations' && (
        <div className="tw-mt-4">
          <Panel title={`Réservations (${reservations.length})`} icon={FaFolderOpen}>
            {reservations.length === 0 ? <Empty>Aucune réservation.</Empty> : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {reservations.map((r, i) => (
                  <Row key={r.id || i} icon={FaBookOpen} iconTone={PURPLE}
                    title={r.livreTitre || `Réservation #${r.id}`}
                    subtitle={`${nomEtu(r)} · réservé le ${frDate(r.dateReservation)} · expire ${frDate(r.dateExpiration)}`}
                    right={<Pill tone={BLUE}>{r.statut}</Pill>} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Catégories */}
      {tab === 'categories' && (
        <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4">
          <div className="tw-flex tw-justify-end">
            <button type="button" onClick={onToggleCategorieForm} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold hover:tw-brightness-105">
              {showCategorieForm ? 'Annuler' : <><FaPlus /> Nouvelle catégorie</>}
            </button>
          </div>

          {showCategorieForm && (
            <Panel title="Ajouter une catégorie" icon={FaFolderOpen}>
              <form onSubmit={onSubmitCategorie} className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2">
                <Field label="Nom *"><input className={inputCls} value={categorieForm.nom} onChange={(e) => setCategorieForm({ ...categorieForm, nom: e.target.value })} required /></Field>
                <Field label="Code"><input className={inputCls} value={categorieForm.code} onChange={(e) => setCategorieForm({ ...categorieForm, code: e.target.value })} /></Field>
                <div className="sm:tw-col-span-2">
                  <Field label="Description"><textarea rows="2" className={inputCls} value={categorieForm.description} onChange={(e) => setCategorieForm({ ...categorieForm, description: e.target.value })} /></Field>
                </div>
                <div className="tw-flex tw-gap-2.5">
                  <button type="submit" className="tw-inline-flex tw-h-10 tw-items-center tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold">Créer</button>
                </div>
              </form>
            </Panel>
          )}

          <Panel title={`Catégories (${categories.length})`} icon={FaFolderOpen}>
            {categories.length === 0 ? <Empty>Aucune catégorie.</Empty> : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {categories.map((c, i) => (
                  <Row key={c.id || i} icon={FaFolderOpen} iconTone={GOLD}
                    title={c.nom}
                    subtitle={`${c.code || '—'}${c.description ? ` · ${c.description}` : ''}`}
                    right={<SmallButton danger icon={FaTrash} onClick={() => onSupprimerCategorie(c.id)}>Désactiver</SmallButton>} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </PremiumPage>
  );
}
