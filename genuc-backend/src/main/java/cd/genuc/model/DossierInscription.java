package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dossiers_inscription")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DossierInscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String numeroDossier;

    // ──────────────────────────────────────────────────────────
    // Étape 1 : Identité & Coordonnées
    // ──────────────────────────────────────────────────────────
    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false, unique = true)
    private String email;

    private String telephone;

    // ✅ SÉCURITÉ : Ce mot de passe est stocké TEMPORAIREMENT en clair
    // pour permettre la création du compte Utilisateur lors de la validation.
    // Il ne doit JAMAIS être exposé dans les réponses JSON.
    @JsonIgnore
    private String motDePasse;

    private String sexe;
    private String lieuNaissance;
    private LocalDate dateNaissance;
    private String adresse;

    private String nationalite;
    private String etatCivil;
    private String telephone2;

    private String province;
    private String ville;
    private String commune;
    private String quartier;
    private String avenue;
    private String numeroResidence;
    
    
 // À ajouter dans la classe DossierInscription

 // ─── Champs pour étudiants internationaux ──────────────────────
 private String paysResidence;
 private String paysOrigine;
 private String codeTelephone;         // ex: "+243"
 private String typePieceIdentite;     // PASSEPORT, CARTE_NATIONALE, PERMIS
 private String numeroPieceIdentite;
 @Builder.Default
 private Boolean residentEtranger = false;
 private String visaNumero;
 private LocalDate dateExpirationVisa;

    // ──────────────────────────────────────────────────────────
    // Étape 2 : Parcours académique
    // ──────────────────────────────────────────────────────────
    @Column(nullable = false)
    private String niveauVise;   // L1, L2, L3, MASTER

    private Long universiteId;
    private Long departementId;
    private Long filiereId;

    private String typeInscription;   // NOUVELLE, REINSCRIPTION, TRANSFERT

    // Diplôme d'État (secondaire)
    private String ecoleSecondaire;
    private String provinceEcole;
    private String anneeObtention;
    private String numeroDiplome;
    private String pourcentage;
    private String option;

    // Code EXETAT du Diplôme d'État — OBLIGATOIRE si l'année d'obtention >= 2022
    // (règle du processus d'admission). Vérifié manuellement par l'agent d'admissions
    // sur la plateforme officielle (année >= 2022) ; pour les années < 2022, la
    // vérification se fait sur les documents téléversés.
    private String codeExetat;

    @Builder.Default
    private Boolean exetatVerifie = false;
    private LocalDateTime exetatVerifieLe;
    private String exetatVerifiePar;        // nom de l'agent ayant vérifié

    // ──────────────────────────────────────────────────────────
    // Étape 3 : Parents, Tuteur & Urgence
    // ──────────────────────────────────────────────────────────
    private String pereNom;
    private String pereProfession;
    private String pereTelephone;
    private String mereNom;
    private String mereProfession;
    private String mereTelephone;
    private String tuteurNom;
    private String tuteurLien;
    private String tuteurTelephone;
    private String tuteurAdresse;
    private String urgenceNom;
    private String urgenceTelephone;
    private String allergies;
    private String handicap;

    // ──────────────────────────────────────────────────────────
    // Étape 4 : Documents (URLs des fichiers uploadés)
    // ──────────────────────────────────────────────────────────
    private String urlPhoto;
    private String urlPhotoPasseport;
    private String urlDiplomeEtat;
    private String urlAttestationReussite;   // RDC : remplace le diplôme d'État s'il n'est pas encore délivré par le ministère
    private String urlReleveNotes;
    private String urlActeNaissance;
    private String urlAttestationNationalite;
    private String urlCarteIdentite;
    private String urlLettreRecommandation;
    private String urlAttestationPhysique;
    private String urlAttestationConduite;

    // ──────────────────────────────────────────────────────────
    // Étape 7 : Paiement
    // ──────────────────────────────────────────────────────────
    private String modePaiement;        // MOBILE_MONEY, CASH, BANQUE
    private String numeroTransaction;
    private Boolean bourse;
    private Double montantPaye;

    // ── Paiement des frais d'inscription (préalable au traitement du dossier) ──
    @Builder.Default
    private Boolean fraisInscriptionPayes = false;
    private String referencePaiement;
    private LocalDateTime datePaiementInscription;

    // Montant des frais d'inscription attendus (copié depuis la vacation choisie à la soumission)
    private Double montantInscription;
    private String deviseInscription;
    private Long vacationId;

    // Test d'admission : requis si < 60% au diplôme d'État OU si la filière l'exige ;
    // passe à true quand le test est réussi.
    private Boolean testAdmissionReussi;

    // Champ calculé (non persisté) renseigné par le service lors du listing :
    // le test d'admission est-il requis pour ce dossier (filière l'exige OU
    // < 60 %, et non encore réussi) ? Pilote la bannière du secrétariat.
    @Transient
    private Boolean testAdmissionRequis;

    // ──────────────────────────────────────────────────────────
    // Statut du dossier
    // ──────────────────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String commentaire;          // note interne admin

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutDossier statut = StatutDossier.EN_ATTENTE;

    private String motifRejet;

    // ── Attribution à un agent d'admissions (après paiement confirmé) ──────
    // Le dossier est attribué automatiquement (round-robin) à un secrétaire
    // académique de l'université dès que les frais de dossier sont payés.
    private Long agentAdmissionId;
    private String agentAdmissionNom;
    private LocalDateTime attribueLe;

    // ── Demande de documents complémentaires (secrétariat) ──────────
    private String documentsDemandes;   // clés des documents requis, séparées par des virgules

    @Column(columnDefinition = "TEXT")
    private String messageSecretaire;    // message accompagnant la demande de documents

    @Column(updatable = false)
    private LocalDateTime creeLe;

    // ──────────────────────────────────────────────────────────
    // Méthodes
    // ──────────────────────────────────────────────────────────
    @PrePersist
    protected void onCreate() {
        creeLe = LocalDateTime.now();
        if (numeroDossier == null) {
            numeroDossier = genererNumeroDossier();
        }
    }

    private String genererNumeroDossier() {
        int annee = LocalDate.now().getYear();
        return String.format("DOS-%d-%06d", annee, System.currentTimeMillis() % 1000000);
    }

    public enum StatutDossier {
        EN_ATTENTE, DOCUMENTS_MANQUANTS, TEST_ADMISSION, VALIDE, REJETE
    }
}