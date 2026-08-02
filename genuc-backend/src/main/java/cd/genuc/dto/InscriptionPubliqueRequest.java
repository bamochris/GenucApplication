package cd.genuc.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class InscriptionPubliqueRequest {

    // Étape 1 : Identité
    @NotBlank private String nom;
    private String postnom;
    @NotBlank private String prenom;
    @NotBlank private String sexe;
    @NotNull private LocalDate dateNaissance;
    @NotBlank private String lieuNaissance;
    private String nationalite;
    private String etatCivil;
    @NotBlank private String telephone1;
    private String telephone2;
    @NotBlank @Email private String email;
    private String province;
    private String ville;
    private String commune;
    private String quartier;
    private String avenue;
    private String numeroResidence;
    private String adresse; // calculé côté frontend

    // Étape 2 : Académique
    @NotNull private Long anneeAcademiqueId;
    @NotNull private Long universiteId;
    @NotNull private Long departementId;
    @NotNull private Long filiereId;
    private Long vacationId;
    @NotBlank private String niveauVise; // "L1","L2","L3","MASTER"
    private String typeInscription;

    // École secondaire
    private String ecoleSecondaire;
    private String provinceEcole;
    private String anneeObtention;
    private String numeroDiplome;
    private String pourcentage;
    private String option;
    private String codeExetat;   // obligatoire si anneeObtention >= 2022

    // Étape 3 : Parents & Urgence
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

    // Étape 5 : Compte
    // ✅ SÉCURITÉ : Mot de passe minimum 8 caractères
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String motDePasse;

    // Étape 7 : Paiement
    private String modePaiement;
    private String numeroTransaction;
    private Boolean bourse;
    private Double montantPaye;

    // Acceptation
    private Boolean certifie;
    private Boolean accepteReglement;
    
 // À ajouter dans la classe InscriptionPubliqueRequest

 // ─── Champs pour étudiants internationaux ──────────────────────
 private String paysResidence;
 private String paysOrigine;
 private String codeTelephone;         // ex: "+243"
 private String typePieceIdentite;     // PASSEPORT, CARTE_NATIONALE, PERMIS
 private String numeroPieceIdentite;
 private Boolean residentEtranger = false;
 private String visaNumero;
 private LocalDate dateExpirationVisa;
}