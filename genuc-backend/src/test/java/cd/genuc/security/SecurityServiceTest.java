package cd.genuc.security;

import cd.genuc.model.DossierInscription;
import cd.genuc.model.Etudiant;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Transaction;
import cd.genuc.model.Universite;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.DossierInscriptionRepository;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.InscriptionRepository.ProprietaireInscription;
import cd.genuc.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Garde central contre l'IDOR : ces tests décrivent précisément ce qui était possible
 * avant le correctif — un étudiant authentifié pouvait lire ET modifier le dossier
 * d'un autre étudiant en changeant l'{@code inscriptionId} de l'URL, le rôle seul
 * étant vérifié.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SecurityServiceTest {

    @Mock private InscriptionRepository inscriptionRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private DossierInscriptionRepository dossierInscriptionRepository;

    private SecurityService securityService() {
        return new SecurityService(inscriptionRepository, transactionRepository, dossierInscriptionRepository);
    }

    // ─── Étudiant ────────────────────────────────────────────────

    @Test
    void etudiant_PeutAccederASaPropreInscription() {
        Utilisateur etudiant = compte(RoleEnum.ETUDIANT, "etudiant@unikin.cd", 1L, 42L);

        assertThat(securityService().peutAccederInscription(42L, auth(etudiant))).isTrue();
    }

    @Test
    void etudiant_NePeutPasAccederAUneAutreInscription() {
        Utilisateur etudiant = compte(RoleEnum.ETUDIANT, "etudiant@unikin.cd", 1L, 42L);

        assertThat(securityService().peutAccederInscription(43L, auth(etudiant))).isFalse();
        // Aucune requête base : le claim du JWT suffit à trancher.
        verify(inscriptionRepository, never()).findProprietaire(anyLong());
    }

    /**
     * Comptes anciens sans lien Utilisateur → Inscription : repli sur l'email, la
     * correspondance devant être exacte.
     */
    @Test
    void etudiantSansInscriptionIdLie_EstAutoriseParEmailIdentique() {
        Utilisateur etudiant = compte(RoleEnum.ETUDIANT, "jean@unikin.cd", 1L, null);
        when(inscriptionRepository.findProprietaire(42L))
                .thenReturn(Optional.of(proprietaire(1L, "jean@unikin.cd", null)));

        assertThat(securityService().peutAccederInscription(42L, auth(etudiant))).isTrue();
    }

    @Test
    void etudiantSansInscriptionIdLie_EstRefuseSiEmailDifferent() {
        Utilisateur etudiant = compte(RoleEnum.ETUDIANT, "jean@unikin.cd", 1L, null);
        when(inscriptionRepository.findProprietaire(42L))
                .thenReturn(Optional.of(proprietaire(1L, "marie@unikin.cd", "marie@unikin.cd")));

        assertThat(securityService().peutAccederInscription(42L, auth(etudiant))).isFalse();
    }

    // ─── Personnel : cloisonnement multi-tenant ──────────────────

    @Test
    void personnel_PeutAccederAUneInscriptionDeSonUniversite() {
        Utilisateur admin = compte(RoleEnum.ADMIN_UNIVERSITE, "admin@unikin.cd", 7L, null);
        when(inscriptionRepository.findProprietaire(42L))
                .thenReturn(Optional.of(proprietaire(7L, "etudiant@unikin.cd", null)));

        assertThat(securityService().peutAccederInscription(42L, auth(admin))).isTrue();
    }

    @Test
    void personnel_NePeutPasAccederAUneInscriptionDUneAutreUniversite() {
        Utilisateur admin = compte(RoleEnum.ADMIN_UNIVERSITE, "admin@unikin.cd", 7L, null);
        when(inscriptionRepository.findProprietaire(42L))
                .thenReturn(Optional.of(proprietaire(9L, "etudiant@unilu.cd", null)));

        assertThat(securityService().peutAccederInscription(42L, auth(admin))).isFalse();
    }

    @Test
    void personnelSansUniversiteDeRattachement_EstRefuse() {
        Utilisateur agent = compte(RoleEnum.AGENT, "agent@genuc.cd", null, null);

        assertThat(securityService().peutAccederInscription(42L, auth(agent))).isFalse();
    }

    // ─── Rôles globaux ───────────────────────────────────────────

    @Test
    void superAdmin_AccedeATouteInscription() {
        Utilisateur superAdmin = compte(RoleEnum.SUPER_ADMIN, "admin@genuc.cd", null, null);

        assertThat(securityService().peutAccederInscription(999L, auth(superAdmin))).isTrue();
    }

    // ─── Cas dégradés ────────────────────────────────────────────

    @Test
    void authentificationAbsente_EstRefusee() {
        assertThat(securityService().peutAccederInscription(42L, null)).isFalse();
    }

    @Test
    void principalAnonyme_EstRefuse() {
        Authentication anonyme = new AnonymousAuthenticationToken(
                "cle", "anonymousUser", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS")));

        assertThat(securityService().peutAccederInscription(42L, anonyme)).isFalse();
    }

    @Test
    void inscriptionIdNul_EstRefuse() {
        Utilisateur etudiant = compte(RoleEnum.ETUDIANT, "etudiant@unikin.cd", 1L, 42L);

        assertThat(securityService().peutAccederInscription(null, auth(etudiant))).isFalse();
    }

    @Test
    void inscriptionInexistante_EstRefusee() {
        Utilisateur admin = compte(RoleEnum.ADMIN_UNIVERSITE, "admin@unikin.cd", 7L, null);
        when(inscriptionRepository.findProprietaire(404L)).thenReturn(Optional.empty());

        assertThat(securityService().peutAccederInscription(404L, auth(admin))).isFalse();
    }

    // ─── Cloisonnement par université ────────────────────────────

    @Test
    void peutAccederUniversite_RespecteLeRattachement() {
        Utilisateur admin = compte(RoleEnum.ADMIN_UNIVERSITE, "admin@unikin.cd", 7L, null);
        SecurityService service = securityService();

        assertThat(service.peutAccederUniversite(7L, auth(admin))).isTrue();
        assertThat(service.peutAccederUniversite(9L, auth(admin))).isFalse();
    }

    // ─── Transactions de paiement ────────────────────────────────
    //
    // Avant correctif, ces endpoints portaient @PreAuthorize("isAuthenticated()"),
    // qui ne filtrait rien de plus que la règle d'URL déjà en place : n'importe
    // quel compte connecté pouvait annuler la transaction d'un tiers en énumérant
    // les identifiants.

    @Test
    void etudiant_NePeutPasAnnulerLaTransactionDUnAutre() {
        Utilisateur etudiant = compte(RoleEnum.ETUDIANT, "etudiant@unikin.cd", 1L, 42L);
        when(transactionRepository.findById(500L))
                .thenReturn(Optional.of(transaction(500L, "victime@unikin.cd", 1L, null)));

        assertThat(securityService().peutAccederTransaction(500L, auth(etudiant))).isFalse();
    }

    @Test
    void etudiant_PeutAnnulerSaPropreTransaction() {
        Utilisateur etudiant = compte(RoleEnum.ETUDIANT, "etudiant@unikin.cd", 1L, 42L);
        when(transactionRepository.findById(500L))
                .thenReturn(Optional.of(transaction(500L, "etudiant@unikin.cd", 1L, null)));

        assertThat(securityService().peutAccederTransaction(500L, auth(etudiant))).isTrue();
    }

    @Test
    void initiateur_PeutAnnulerLaTransactionQuIlACreee() {
        Utilisateur caissier = compte(RoleEnum.CAISSIER, "caissier@unikin.cd", 1L, null);
        when(transactionRepository.findById(500L))
                .thenReturn(Optional.of(transaction(500L, "autre@unikin.cd", 9L, caissier)));

        assertThat(securityService().peutAccederTransaction(500L, auth(caissier))).isTrue();
    }

    @Test
    void personnel_NeVoitPasLesTransactionsDUneAutreUniversite() {
        Utilisateur caissier = compte(RoleEnum.CAISSIER, "caissier@unikin.cd", 1L, null);
        when(transactionRepository.findByTransactionCode("TXN-ABC"))
                .thenReturn(Optional.of(transaction(500L, "autre@unilu.cd", 9L, null)));

        assertThat(securityService().peutAccederTransactionParCode("TXN-ABC", auth(caissier))).isFalse();
    }

    @Test
    void transactionInexistante_EstRefuseeSansRevelerSonAbsence() {
        Utilisateur etudiant = compte(RoleEnum.ETUDIANT, "etudiant@unikin.cd", 1L, 42L);
        when(transactionRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThat(securityService().peutAccederTransaction(999L, auth(etudiant))).isFalse();
    }

    // ─── Dossiers d'inscription ──────────────────────────────────
    //
    // Sans garde, tout compte connecté pouvait faire passer n'importe quel dossier
    // EN_ATTENTE au statut REJETE : sabotage silencieux des admissions.

    @Test
    void candidat_NePeutPasAnnulerLeDossierDUnAutre() {
        Utilisateur candidat = compte(RoleEnum.ETUDIANT, "candidat@mail.cd", 1L, null);
        when(dossierInscriptionRepository.findById(77L))
                .thenReturn(Optional.of(dossier(77L, "victime@mail.cd", 1L)));

        assertThat(securityService().peutAccederDossier(77L, auth(candidat))).isFalse();
    }

    @Test
    void candidat_PeutAnnulerSonPropreDossier() {
        Utilisateur candidat = compte(RoleEnum.ETUDIANT, "candidat@mail.cd", 1L, null);
        when(dossierInscriptionRepository.findById(77L))
                .thenReturn(Optional.of(dossier(77L, "Candidat@Mail.CD", 1L)));

        assertThat(securityService().peutAccederDossier(77L, auth(candidat))).isTrue();
    }

    @Test
    void personnel_NeTraiteQueLesDossiersDeSonEtablissement() {
        Utilisateur secretaire = compte(RoleEnum.SECRETAIRE_ACADEMIQUE, "sec@unikin.cd", 1L, null);
        SecurityService service = securityService();

        when(dossierInscriptionRepository.findById(77L))
                .thenReturn(Optional.of(dossier(77L, "candidat@mail.cd", 1L)));
        assertThat(service.peutAccederDossier(77L, auth(secretaire))).isTrue();

        when(dossierInscriptionRepository.findById(88L))
                .thenReturn(Optional.of(dossier(88L, "candidat@mail.cd", 2L)));
        assertThat(service.peutAccederDossier(88L, auth(secretaire))).isFalse();
    }

    @Test
    void superAdmin_AccedeAToutDossierSansRequeteInutile() {
        Utilisateur superAdmin = compte(RoleEnum.SUPER_ADMIN, "admin@genuc.cd", null, null);

        assertThat(securityService().peutAccederDossier(77L, auth(superAdmin))).isTrue();
        verify(dossierInscriptionRepository, never()).findById(anyLong());
    }

    // ══════════════════════════════════════════
    // Fabriques
    // ══════════════════════════════════════════

    private Transaction transaction(Long id, String emailEtudiant, Long universiteId, Utilisateur createdBy) {
        Etudiant etudiant = new Etudiant();
        etudiant.setEmail(emailEtudiant);

        Universite universite = new Universite();
        universite.setId(universiteId);

        Transaction t = new Transaction();
        t.setId(id);
        t.setTransactionCode("TXN-ABC");
        t.setStudent(etudiant);
        t.setUniversite(universite);
        t.setCreatedBy(createdBy);
        return t;
    }

    private DossierInscription dossier(Long id, String email, Long universiteId) {
        DossierInscription d = new DossierInscription();
        d.setId(id);
        d.setEmail(email);
        d.setUniversiteId(universiteId);
        return d;
    }

    private Utilisateur compte(RoleEnum role, String email, Long universiteId, Long inscriptionId) {
        return Utilisateur.builder()
                .id(1L).nom("TEST").prenom("Compte")
                .email(email).motDePasse("x")
                .role(role)
                .universiteId(universiteId)
                .inscriptionId(inscriptionId)
                .build();
    }

    private Authentication auth(Utilisateur u) {
        return new UsernamePasswordAuthenticationToken(
                u, null, List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())));
    }

    private ProprietaireInscription proprietaire(Long universiteId, String emailInscription, String emailEtudiant) {
        return new ProprietaireInscription() {
            @Override public Long getUniversiteId()     { return universiteId; }
            @Override public String getEmailInscription() { return emailInscription; }
            @Override public String getEmailEtudiant()   { return emailEtudiant; }
            @Override public String getMatricule()       { return "HECKIN202500001"; }
            // Ajouté à la projection en même temps que le cloisonnement par
            // département : la valeur ne pèse sur aucun de ces tests, qui portent
            // sur la propriété et l'établissement.
            @Override public Long getDepartementId()     { return null; }
        };
    }
}
