package cd.genuc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Réponse plate pour le module Évaluations du professeur
 * (Examens / Interrogations / TP-TD) — construite à partir de l'entité {@link cd.genuc.model.Examen}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationAcademiqueResponse {
    private Long id;
    private String titre;
    private Long coursId;
    private String coursCode;
    private String coursTitre;
    private LocalDate date;
    private Integer duree;
    private Double coefficient;
    private String salle;
    private Integer questions;
    private Integer nbGroupes;
    private String statut;
    private String type;
    private Long professeurId;
}
