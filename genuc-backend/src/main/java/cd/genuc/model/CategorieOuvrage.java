package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories_ouvrage")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorieOuvrage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    private String description;

    private String code;

    @ManyToOne
    @JoinColumn(name = "universite_id")
    @JsonIgnore
    @ToString.Exclude
    private Universite universite;

    @Builder.Default
    private boolean actif = true;
}