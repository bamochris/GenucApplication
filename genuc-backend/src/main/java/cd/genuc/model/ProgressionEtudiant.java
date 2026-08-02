package cd.genuc.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "progressions_etudiants", uniqueConstraints = @UniqueConstraint(columnNames = { "inscription_id",
		"cours_id" }))
public class ProgressionEtudiant {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Builder.Default
	private Integer pourcentageCompletion = 0;

	@Builder.Default
	private Integer leconsCompletees = 0;

	@Builder.Default
	private Integer leconsTotal = 0;

	@Builder.Default
	@Column(columnDefinition = "TEXT")
	private String leconsCompleteesList = "[]";

	private LocalDateTime dernierAcces;
	private LocalDateTime dateCompletion;

	@Builder.Default
	private Integer tempsPasseMinutes = 0;

	@Builder.Default
	private boolean coursComplete = false;

	@Column(updatable = false)
	private LocalDateTime creeLe;

	@PrePersist
	protected void onCreate() {
		creeLe = LocalDateTime.now();
		dernierAcces = LocalDateTime.now();
	}

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "inscription_id", nullable = false)
	@JsonIgnore
	@ToString.Exclude
	private Inscription inscription;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "cours_id", nullable = false)
	@JsonIgnore
	@ToString.Exclude
	private Cours cours;

	public void marquerLeconCompletee(Long leconId) {
		if (!leconsCompleteesList.contains(leconId.toString())) {
			String ids = leconsCompleteesList.replace("[", "").replace("]", "").trim();
			if (ids.isEmpty()) {
				leconsCompleteesList = "[" + leconId + "]";
			} else {
				leconsCompleteesList = "[" + ids + "," + leconId + "]";
			}
			leconsCompletees++;
			dernierAcces = LocalDateTime.now();
			recalculerPourcentage();
		}
	}

	public void recalculerPourcentage() {
		if (leconsTotal > 0) {
			pourcentageCompletion = (int) Math.round((double) leconsCompletees / leconsTotal * 100);
			if (pourcentageCompletion >= 100) {
				coursComplete = true;
				dateCompletion = LocalDateTime.now();
			}
		}
	}
}
