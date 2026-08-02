// Variante « premium » (bleu nuit & or) du tableau de bord Caissier.
// Console opérationnelle : caisse, validation des paiements, bons, TachPay, espèces.
// Tous les handlers proviennent du parent (état partagé) ; les overlays (rejet,
// clôture, TachPayCheckout) restent montés côté parent.
import {
  FaMoneyBillWave, FaArrowDown, FaExchangeAlt, FaExclamationTriangle,
  FaLockOpen, FaLock, FaMobileAlt, FaSyncAlt, FaPlus, FaSearch, FaPrint,
  FaCashRegister, FaBook, FaReceipt, FaQrcode, FaMoneyBill, FaClipboardList,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, Kpi, KpiGrid, Panel, Empty, Row, Pill,
  SmallButton, ActionTiles, GOLD, TEAL, BLUE, PURPLE, RED, alpha, initialsOf,
} from '../premium/kit';

const inputCls = 'tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-2 tw-text-sm tw-text-foreground tw-outline-none focus:tw-border-primary/40';
const frDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const ACTIONS = [
  { icon: FaMoneyBill, label: 'Encaissement', to: '/finances/caissier/encaissement', tone: TEAL },
  { icon: FaBook, label: 'Journal', to: '/finances/caissier/journal', tone: BLUE },
  { icon: FaLock, label: 'Clôture', to: '/finances/caissier/cloture', tone: GOLD },
  { icon: FaClipboardList, label: 'Rapports', to: '/finances/caissier/rapports', tone: PURPLE },
];

function statutTone(s) {
  if (s === 'VALIDE' || s === 'PAYEE') return TEAL;
  if (s === 'REJETE' || s === 'EN_RETARD') return RED;
  return GOLD;
}

function TabBar({ onglet, onSelect, tabs }) {
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-rounded-xl tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-1.5">
      {tabs.map(([id, label]) => (
        <button key={id} type="button" onClick={() => onSelect(id)}
          className={`tw-rounded-lg tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-transition ${onglet === id ? 'tw-bg-primary tw-text-primary-foreground tw-shadow-gold' : 'tw-text-muted-foreground hover:tw-text-foreground'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function CaissierDashboardPremium(props) {
  const {
    user, attente = [], historique = [], rapportJour, caisse, stats = {},
    echeancesARecouvrer = [], operations = [], loadingOps, onglet, onSelectOnglet,
    soldeInitial, setSoldeInitial, soldeFinal, setSoldeFinal, onOuvrirCaisse, onFermerCaisse,
    message, error, onClearMessage, onClearError, onOpenCheckout, onRefresh,
    showDepenseForm, onToggleDepense, depenseForm, setDepenseForm, onEnregistrerDepense,
    onValiderPaiement, onRejeterPaiement, onImprimerRecu, onTraiterEcheance, onRefreshJournal,
    bonNumero, setBonNumero, bonVerif, bonVerifErreur, bonVerifLoading, onVerifierBon, onResetBon,
    tachpayRapport, loadingTachPay, onRefreshTachPay, scanBon, setScanBon, scanResult, scanError,
    scanLoading, onValiderBonTachPay, especesForm, setEspecesForm, especesStudent, especesLoading,
    especesMsg, onRechercherEspeces, onPayerEspeces,
  } = props;

  return (
    <PremiumPage>
      <PremiumHeader
        initials={initialsOf(user?.nomComplet || user?.email)}
        eyebrow="Caisse"
        title="Gestion des paiements"
        subtitle={`${user?.nomComplet || user?.email} · ${user?.universiteNom || 'Université'}`}
        badges={
          <>
            <button type="button" onClick={onOpenCheckout} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold hover:tw-brightness-105">
              <FaMobileAlt /> Nouveau paiement TachPay
            </button>
            <button type="button" onClick={onRefresh} title="Rafraîchir" className="tw-inline-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-text-muted-foreground hover:tw-text-foreground"><FaSyncAlt /></button>
            <button type="button" onClick={onToggleDepense} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-text-sm tw-font-semibold tw-text-muted-foreground hover:tw-text-foreground">
              {showDepenseForm ? 'Annuler' : <><FaPlus /> Dépense</>}
            </button>
          </>
        }
      />

      {message?.text && <div className="tw-mb-4 tw-cursor-pointer tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: alpha(message.type === 'success' ? TEAL : RED, 0.3), background: alpha(message.type === 'success' ? TEAL : RED, 0.1), color: message.type === 'success' ? TEAL : 'hsl(0 80% 78%)' }} onClick={onClearMessage}>{message.text}</div>}
      {error && <div className="tw-mb-4 tw-cursor-pointer tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: alpha(RED, 0.3), background: alpha(RED, 0.1), color: 'hsl(0 80% 78%)' }} onClick={onClearError}>{error}</div>}

      <ActionTiles actions={ACTIONS} title="Actions rapides" />

      <div className="tw-mt-4">
        <KpiGrid>
          <Kpi icon={FaMoneyBillWave} label="Total encaissé" value={`${stats.totalEncaisse || 0} USD`} tone={TEAL} delay={0} />
          <Kpi icon={FaArrowDown} label="Total dépenses" value={`${stats.totalDepenses || 0} USD`} tone={RED} delay={70} />
          <Kpi icon={FaExchangeAlt} label="Transactions" value={stats.nbTransactions || 0} tone={BLUE} delay={140} />
          <Kpi icon={FaExclamationTriangle} label="Échéances à recouvrer" value={echeancesARecouvrer.length} tone={echeancesARecouvrer.length > 0 ? RED : TEAL} delay={210} />
        </KpiGrid>
      </div>

      {/* Caisse */}
      <div className="tw-mt-4">
        <Panel title={caisse ? 'Caisse ouverte' : 'Caisse fermée'} icon={caisse ? FaLockOpen : FaLock}>
          {caisse ? (
            <div>
              <p className="tw-text-sm tw-text-muted-foreground">Ouverte le <span className="tw-font-semibold tw-text-foreground">{frDate(caisse.dateOuverture)}</span> · solde initial <span className="tw-font-semibold tw-text-foreground">{caisse.soldeInitial} USD</span></p>
              <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2.5">
                <input type="number" step="0.01" placeholder="Solde final" value={soldeFinal} onChange={(e) => setSoldeFinal(e.target.value)} className={`${inputCls} tw-w-48`} />
                <button type="button" onClick={onFermerCaisse} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-px-4 tw-text-sm tw-font-semibold" style={{ background: alpha(RED, 0.14), color: RED, border: `1px solid ${alpha(RED, 0.3)}` }}><FaLock /> Fermer la caisse</button>
              </div>
            </div>
          ) : (
            <div className="tw-flex tw-flex-wrap tw-gap-2.5">
              <input type="number" step="0.01" placeholder="Solde initial" value={soldeInitial} onChange={(e) => setSoldeInitial(e.target.value)} className={`${inputCls} tw-w-48`} />
              <button type="button" onClick={onOuvrirCaisse} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold"><FaLockOpen /> Ouvrir la caisse</button>
            </div>
          )}
        </Panel>
      </div>

      {/* Dépense */}
      {showDepenseForm && (
        <div className="tw-mt-4">
          <Panel title="Enregistrer une dépense" icon={FaArrowDown}>
            <form onSubmit={onEnregistrerDepense} className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2">
              <label className="tw-flex tw-flex-col tw-gap-1"><span className="tw-text-xs tw-text-muted-foreground">Libellé *</span><input className={inputCls} value={depenseForm.libelle} onChange={(e) => setDepenseForm({ ...depenseForm, libelle: e.target.value })} required placeholder="Ex : Achat fournitures" /></label>
              <label className="tw-flex tw-flex-col tw-gap-1"><span className="tw-text-xs tw-text-muted-foreground">Montant (USD) *</span><input type="number" step="0.01" className={inputCls} value={depenseForm.montant} onChange={(e) => setDepenseForm({ ...depenseForm, montant: e.target.value })} required placeholder="0.00" /></label>
              <label className="tw-flex tw-flex-col tw-gap-1"><span className="tw-text-xs tw-text-muted-foreground">Catégorie</span>
                <select className={inputCls} value={depenseForm.categorie} onChange={(e) => setDepenseForm({ ...depenseForm, categorie: e.target.value })}>
                  {['FOURNITURE', 'ENTRETIEN', 'TRANSPORT', 'SALAIRE', 'AUTRE'].map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                </select>
              </label>
              <label className="tw-flex tw-flex-col tw-gap-1 sm:tw-col-span-2"><span className="tw-text-xs tw-text-muted-foreground">Description</span><textarea rows="2" className={inputCls} value={depenseForm.description} onChange={(e) => setDepenseForm({ ...depenseForm, description: e.target.value })} placeholder="Détails complémentaires…" /></label>
              <button type="submit" className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold sm:tw-col-span-2"><FaMoneyBillWave /> Enregistrer la dépense</button>
            </form>
          </Panel>
        </div>
      )}

      {/* Résumé du jour */}
      {rapportJour && (
        <div className="tw-mt-4">
          <Panel title={`Résumé du jour — ${rapportJour.date || ''}`} icon={FaCashRegister}>
            <div className="tw-grid tw-grid-cols-3 tw-gap-2.5">
              {[
                { label: 'Total collecté', value: `${rapportJour.totalCollecte || 0} USD`, tone: TEAL },
                { label: 'Transactions', value: rapportJour.nbTransactions || 0, tone: BLUE },
                { label: 'En attente', value: rapportJour.nbEnAttente || 0, tone: (rapportJour.nbEnAttente || 0) > 0 ? RED : GOLD },
              ].map((s) => (
                <div key={s.label} className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3 tw-text-center">
                  <p className="tw-text-lg tw-font-extrabold" style={{ color: s.tone }}>{s.value}</p>
                  <p className="tw-text-xs tw-text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* Onglets */}
      <div className="tw-mt-5">
        <TabBar onglet={onglet} onSelect={onSelectOnglet} tabs={[
          ['attente', `En attente (${attente.length})`],
          ['historique', 'Historique'],
          ['echeances', 'Échéances'],
          ['journal', 'Journal de caisse'],
          ['tachpay', 'TachPay'],
        ]} />
      </div>

      {/* En attente */}
      {onglet === 'attente' && (
        <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4">
          <Panel title="Vérifier un bon de paiement" icon={FaQrcode} subtitle="Scannez le QR ou saisissez la référence, puis Entrée">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2.5">
              <input type="text" autoFocus className={`${inputCls} tw-min-w-[220px] tw-flex-1`} placeholder="Numéro de référence ou contenu du QR…" value={bonNumero} onChange={(e) => setBonNumero(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onVerifierBon(); }} />
              <button type="button" onClick={onVerifierBon} disabled={bonVerifLoading || !bonNumero.trim()} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold disabled:tw-opacity-60"><FaSearch /> {bonVerifLoading ? 'Vérification…' : 'Vérifier'}</button>
              {(bonVerif || bonVerifErreur) && <button type="button" onClick={onResetBon} className="tw-inline-flex tw-h-10 tw-items-center tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-text-sm tw-font-semibold tw-text-muted-foreground hover:tw-text-foreground">Effacer</button>}
            </div>
            {bonVerifErreur && <div className="tw-mt-3 tw-rounded-lg tw-border tw-px-3 tw-py-2 tw-text-sm" style={{ borderColor: alpha(RED, 0.3), background: alpha(RED, 0.1), color: 'hsl(0 80% 78%)' }}>⚠️ {bonVerifErreur}</div>}
            {bonVerif && (
              <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-3 tw-rounded-lg tw-border tw-p-3 sm:tw-grid-cols-3" style={{ borderColor: alpha(bonVerif.statut === 'VALIDE' ? TEAL : RED, 0.3), background: alpha(bonVerif.statut === 'VALIDE' ? TEAL : RED, 0.08) }}>
                {[
                  ['Statut', <Pill key="s" tone={bonVerif.statut === 'VALIDE' ? TEAL : RED}>{bonVerif.statut === 'VALIDE' ? 'Valide' : 'Invalide'}{bonVerif.utilise ? ' · utilisé' : ''}{bonVerif.expire ? ' · expiré' : ''}</Pill>],
                  ['Numéro', bonVerif.numero],
                  ['Étudiant', `${bonVerif.etudiant || ''} ${bonVerif.matricule ? `(${bonVerif.matricule})` : ''}`],
                  ['Montant', `${bonVerif.montant} USD`],
                  ['Émis le', bonVerif.dateEmission],
                  ['Expire le', bonVerif.dateExpiration],
                ].map(([lbl, val], i) => (
                  <div key={i}>
                    <p className="tw-text-xs tw-text-muted-foreground">{lbl}</p>
                    <div className="tw-text-sm tw-font-semibold tw-text-foreground">{val}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Paiements en attente de validation" icon={FaExclamationTriangle}>
            {attente.length === 0 ? <Empty>Aucun paiement en attente.</Empty> : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {attente.map((p) => (
                  <Row key={p.id} icon={FaReceipt} iconTone={GOLD}
                    title={`${p.montant} ${p.devise || ''} · ${p.inscription?.etudiant?.nomComplet || '—'}`}
                    subtitle={`Réf ${p.reference || '—'} · ${p.type || ''} · ${p.modePaiement || ''} · ${frDate(p.datePaiement)}`}
                    right={
                      <div className="tw-flex tw-gap-1.5">
                        <SmallButton tone={TEAL} onClick={() => onValiderPaiement(p.id)} title={!caisse ? "Ouvrez la caisse d'abord" : ''}>Valider</SmallButton>
                        <SmallButton danger onClick={() => onRejeterPaiement(p.id)} title={!caisse ? "Ouvrez la caisse d'abord" : ''}>Rejeter</SmallButton>
                      </div>
                    } />
                ))}
              </div>
            )}
            {!caisse && attente.length > 0 && <div className="tw-mt-3 tw-rounded-lg tw-border tw-px-3 tw-py-2 tw-text-sm" style={{ borderColor: alpha(GOLD, 0.3), background: alpha(GOLD, 0.1), color: 'hsl(41 70% 72%)' }}>⚠️ Ouvrez la caisse avant de valider ou rejeter des paiements.</div>}
          </Panel>
        </div>
      )}

      {/* Historique */}
      {onglet === 'historique' && (
        <div className="tw-mt-4">
          <Panel title="Historique des paiements" icon={FaBook}>
            {historique.length === 0 ? <Empty>Aucun paiement enregistré.</Empty> : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {historique.map((p) => (
                  <Row key={p.id} icon={FaReceipt} iconTone={BLUE}
                    title={`${p.montant} ${p.devise || ''} · ${p.inscription?.etudiant?.nomComplet || '—'}`}
                    subtitle={`Réf ${p.reference || '—'} · validé le ${p.dateValidation ? frDate(p.dateValidation) : '—'}`}
                    right={
                      <div className="tw-flex tw-items-center tw-gap-1.5">
                        <Pill tone={statutTone(p.statut)}>{p.statut}</Pill>
                        {p.statut === 'VALIDE' && <SmallButton tone={BLUE} icon={FaPrint} onClick={() => onImprimerRecu(p.id)}>Reçu</SmallButton>}
                      </div>
                    } />
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Échéances */}
      {onglet === 'echeances' && (
        <div className="tw-mt-4">
          <Panel title="Échéances à recouvrer" icon={FaClipboardList}>
            {echeancesARecouvrer.length === 0 ? <Empty>Aucune échéance en retard.</Empty> : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {echeancesARecouvrer.map((e) => (
                  <Row key={e.id} icon={FaExclamationTriangle} iconTone={RED}
                    title={`${e.echeancier?.inscription?.etudiant?.nomComplet || '—'} · Échéance #${e.numeroEcheance}`}
                    subtitle={`${e.montant} USD${e.penalite > 0 ? ` · pénalité ${e.penalite} USD` : ''} · ${frDate(e.dateEcheance)}`}
                    right={<SmallButton tone={GOLD} onClick={() => onTraiterEcheance(e.id)}>Traiter</SmallButton>} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Journal */}
      {onglet === 'journal' && (
        <div className="tw-mt-4">
          <Panel title="Journal des opérations" icon={FaBook} action={<button type="button" onClick={onRefreshJournal} disabled={!caisse} className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline disabled:tw-opacity-50">Rafraîchir</button>}>
            {!caisse ? <Empty>Aucune caisse ouverte.</Empty> : loadingOps ? <Empty>Chargement des opérations…</Empty> : operations.length === 0 ? <Empty>Aucune opération enregistrée.</Empty> : (
              <div className="tw-flex tw-flex-col tw-gap-2.5">
                {operations.map((op) => {
                  const tone = op.type === 'ENCAISSEMENT' ? TEAL : op.type === 'REMBOURSEMENT' ? RED : GOLD;
                  return (
                    <Row key={op.id} icon={FaExchangeAlt} iconTone={tone}
                      title={`${op.type === 'ENCAISSEMENT' ? '+' : '-'} ${op.montant} USD · ${op.type}`}
                      subtitle={`${new Date(op.dateOperation).toLocaleString('fr-FR')} · ${op.reference || '—'} · ${op.description || ''}`}
                      right={<span className="tw-text-xs tw-text-muted-foreground">Solde {op.soldeApresOperation} USD</span>} />
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* TachPay */}
      {onglet === 'tachpay' && (
        <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4">
          <Panel title="TachPay — Rapport du jour" icon={FaMobileAlt} action={<button type="button" onClick={onRefreshTachPay} disabled={loadingTachPay} className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline disabled:tw-opacity-50">Rafraîchir</button>}>
            {loadingTachPay ? <Empty>Chargement…</Empty> : tachpayRapport ? (
              <>
                <div className="tw-grid tw-grid-cols-2 tw-gap-2.5 sm:tw-grid-cols-3">
                  <div className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3 tw-text-center"><p className="tw-text-lg tw-font-extrabold" style={{ color: TEAL }}>{tachpayRapport.totalValide?.toFixed(2)} $</p><p className="tw-text-xs tw-text-muted-foreground">Encaissé (validé)</p></div>
                  <div className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3 tw-text-center"><p className="tw-text-lg tw-font-extrabold tw-text-foreground">{tachpayRapport.nbTotal}</p><p className="tw-text-xs tw-text-muted-foreground">Transactions</p></div>
                  <div className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3 tw-text-center"><p className="tw-text-lg tw-font-extrabold" style={{ color: (tachpayRapport.nbEnAttente || 0) > 0 ? GOLD : 'hsl(214 20% 68%)' }}>{tachpayRapport.nbEnAttente}</p><p className="tw-text-xs tw-text-muted-foreground">En attente</p></div>
                </div>
                {tachpayRapport.paiements?.length > 0 && (
                  <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2">
                    {tachpayRapport.paiements.map((p, i) => (
                      <Row key={i} icon={FaReceipt} iconTone={BLUE}
                        title={`${p.montant} $ · ${p.etudiant || '—'}`}
                        subtitle={`${p.reference} · ${p.matricule || '—'} · ${p.modePaiement?.replace('_', ' ') || ''}`}
                        right={<Pill tone={statutTone(p.statut)}>{p.statut}</Pill>} />
                    ))}
                  </div>
                )}
              </>
            ) : <Empty>Aucun rapport disponible.</Empty>}
          </Panel>

          <Panel title="Valider un bon de paiement" icon={FaQrcode} subtitle="Saisissez le numéro du bon ou scannez le QR">
            <div className="tw-flex tw-flex-wrap tw-gap-2.5">
              <input value={scanBon} onChange={(e) => setScanBon(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && onValiderBonTachPay()} placeholder="Ex : BP-2024-00001" className={`${inputCls} tw-min-w-[220px] tw-flex-1 tw-tracking-wider`} />
              <button type="button" onClick={onValiderBonTachPay} disabled={scanLoading || !scanBon.trim()} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold disabled:tw-opacity-60">{scanLoading ? '…' : 'Valider le bon'}</button>
            </div>
            {scanError && <div className="tw-mt-3 tw-rounded-lg tw-border tw-px-3 tw-py-2 tw-text-sm" style={{ borderColor: alpha(RED, 0.3), background: alpha(RED, 0.1), color: 'hsl(0 80% 78%)' }}>{scanError}</div>}
            {scanResult && <div className="tw-mt-3 tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: alpha(TEAL, 0.3), background: alpha(TEAL, 0.1) }}><p className="tw-font-bold" style={{ color: TEAL }}>✅ Bon validé</p><p className="tw-mt-1 tw-text-muted-foreground">Réf {scanResult.reference} · {scanResult.montant} USD · {scanResult.statut}</p></div>}
          </Panel>

          <Panel title="Paiement espèces — accès rapide" icon={FaMoneyBill}>
            <div className="tw-flex tw-flex-wrap tw-gap-2.5">
              <input value={especesForm.matricule} onChange={(e) => { setEspecesForm((f) => ({ ...f, matricule: e.target.value })); }} onKeyDown={(e) => e.key === 'Enter' && onRechercherEspeces()} placeholder="Matricule de l'étudiant" className={`${inputCls} tw-min-w-[200px] tw-flex-1`} />
              <button type="button" onClick={onRechercherEspeces} disabled={especesLoading} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-text-sm tw-font-semibold tw-text-muted-foreground hover:tw-text-foreground"><FaSearch /> {especesLoading ? '…' : 'Rechercher'}</button>
            </div>
            {especesMsg && !especesStudent && <div className="tw-mt-3 tw-rounded-lg tw-border tw-px-3 tw-py-2 tw-text-sm" style={{ borderColor: alpha(RED, 0.3), background: alpha(RED, 0.1), color: 'hsl(0 80% 78%)' }}>{especesMsg}</div>}
            {especesStudent && (
              <div className="tw-mt-3 tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-4">
                <p className="tw-text-sm tw-text-muted-foreground">Étudiant <span className="tw-font-semibold tw-text-foreground">{especesStudent.frais?.[0]?.etudiant || especesForm.matricule}</span> · à payer <span className="tw-font-semibold tw-text-foreground">{especesStudent.montantTotal?.toFixed(2)} USD</span></p>
                <div className="tw-my-3 tw-flex tw-max-h-44 tw-flex-col tw-gap-1.5 tw-overflow-y-auto">
                  {(especesStudent.frais || []).map((f) => {
                    const checked = especesForm.affectationIds.includes(f.id);
                    return (
                      <label key={f.id} className="tw-flex tw-cursor-pointer tw-items-center tw-gap-2.5 tw-rounded-lg tw-px-2.5 tw-py-2 tw-text-sm" style={{ background: checked ? alpha(BLUE, 0.1) : 'transparent' }}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          setEspecesForm((fm) => {
                            const ids = fm.affectationIds.includes(f.id) ? fm.affectationIds.filter((id) => id !== f.id) : [...fm.affectationIds, f.id];
                            const total = (especesStudent.frais || []).filter((x) => ids.includes(x.id)).reduce((s, x) => s + x.reste, 0);
                            return { ...fm, affectationIds: ids, montant: total.toFixed(2) };
                          });
                        }} />
                        <span className="tw-flex-1 tw-text-foreground">{f.libelle}</span>
                        <span className="tw-font-semibold tw-text-foreground">{f.reste} $</span>
                      </label>
                    );
                  })}
                </div>
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2.5">
                  <input type="number" step="0.01" value={especesForm.montant} onChange={(e) => setEspecesForm((f) => ({ ...f, montant: e.target.value }))} placeholder="Montant reçu (USD)" className={`${inputCls} tw-w-48`} />
                  <button type="button" onClick={onPayerEspeces} disabled={especesLoading || !especesForm.montant || especesForm.affectationIds.length === 0} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold disabled:tw-opacity-60"><FaMoneyBill /> {especesLoading ? 'Traitement…' : 'Enregistrer le paiement'}</button>
                </div>
                {especesMsg && <div className="tw-mt-2.5 tw-rounded-lg tw-border tw-px-3 tw-py-2 tw-text-sm" style={{ borderColor: alpha(especesMsg.startsWith('✅') ? TEAL : RED, 0.3), background: alpha(especesMsg.startsWith('✅') ? TEAL : RED, 0.1), color: especesMsg.startsWith('✅') ? TEAL : 'hsl(0 80% 78%)' }}>{especesMsg}</div>}
              </div>
            )}
          </Panel>
        </div>
      )}
    </PremiumPage>
  );
}
