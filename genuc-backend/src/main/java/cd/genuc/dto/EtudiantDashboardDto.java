package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EtudiantDashboardDto {
    
    // Informations personnelles
    private String matricule;
    private String nomComplet;
    private String email;
    private String photo;
    
    // Informations académiques
    private String universite;
    private String departement;
    private String filiere;
    private String promotion;
    private String niveau;
    private String anneeAcademique;
    
    // Résultats académiques
    private Double moyenneGenerale;
    private Integer creditsValides;
    
    // Situation financière
    private Double soldeAPayer;
    
    // Progression
    private Integer progressionGlobale;
    
    // Listes
    @Builder.Default
    private List<NotificationDto> notifications = new ArrayList<>();
    
    @Builder.Default
    private List<CoursSimpleDto> prochainsCours = new ArrayList<>();
    
    @Builder.Default
    private List<ExamenSimpleDto> prochainsExamens = new ArrayList<>();
    
    // Statistiques
    private StatsDto stats;

    // ══════════════════════════════════════════
    // DTOs internes
    // ══════════════════════════════════════════

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationDto {
        private Long id;
        private String message;
        private String type;
        private String date;
        private boolean lu;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CoursSimpleDto {
        private Long id;
        private String titre;
        private String code;
        private String professeur;
        private String thumbnail;
        private Integer progression;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamenSimpleDto {
        private Long id;
        private String titre;
        private LocalDate date;
        private String salle;
        private Integer nbJoursRestant;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsDto {
        private Integer totalCours;
        private Integer coursCompletes;
        private Integer totalSeances;
        private Integer seancesSuivies;
        private Integer messagesNonLus;
    }
    
    
 // Ajouter ces champs dans EtudiantDashboardDto
    private List<NoteSimpleDto> notes;
    private List<EmploiTempsDto> emploiTemps;
    private List<MessageSimpleDto> messages;

    // Ajouter les DTOs internes
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class NoteSimpleDto {
        private String cours;
        private Double noteFinale;
        private String mention;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EmploiTempsDto {
        private String titre;
        private String jour;
        private String heureDebut;
        private String heureFin;
        private String salle;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MessageSimpleDto {
        private String sujet;
        private String contenu;
        private String dateEnvoi;
        private boolean lu;
    }
    
    // ══════════════════════════════════════════
    // Méthodes utilitaires
    // ══════════════════════════════════════════
    
    /**
     * Vérifie si l'étudiant a des dettes
     */
    public boolean hasDebts() {
        return soldeAPayer != null && soldeAPayer > 0;
    }
    
    /**
     * Vérifie si l'étudiant a réussi l'année (moyenne >= 10)
     */
    public boolean isReussi() {
        return moyenneGenerale != null && moyenneGenerale >= 10;
    }
    
    /**
     * Retourne le pourcentage de progression formaté
     */
    public String getProgressionFormatted() {
        return progressionGlobale != null ? progressionGlobale + "%" : "0%";
    }
}