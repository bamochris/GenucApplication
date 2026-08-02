package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliberationServiceTest {

    @Mock
    private DeliberationRepository deliberationRepo;

    @Mock
    private NoteRepository noteRepo;

    @Mock
    private InscriptionRepository inscriptionRepo;

    @Mock
    private UniversiteRepository universiteRepo;

    @Mock
    private DepartementRepository departementRepo;

    @Mock
    private ParametresLMDRepository parametresLMDRepo;

    @Mock
    private CoursRepository coursRepo;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private DeliberationService deliberationService;

    private Inscription inscription;
    private Universite universite;
    private Departement departement;
    private Note note1;
    private Note note2;

    @BeforeEach
    void setUp() {
        universite = Universite.builder()
                .id(1L)
                .nom("Université de Kinshasa")
                .code("UNIKIN")
                .build();

        departement = Departement.builder()
                .id(1L)
                .nom("Département Informatique")
                .faculte(Faculte.builder().id(1L).universite(universite).build())
                .build();

        inscription = Inscription.builder()
                .id(1L)
                .matricule("UNIKIN202600001")
                .nom("MBEMBA")
                .prenom("Jean")
                .niveau("L1")
                .universite(universite)
                .departement(departement)
                .statut(StatutInscription.VALIDE)
                .build();

        Cours cours1 = Cours.builder()
                .id(1L)
                .titre("Algorithmique")
                .code("ALGO101")
                .credits(4)
                .build();

        Cours cours2 = Cours.builder()
                .id(2L)
                .titre("Base de données")
                .code("BDD101")
                .credits(3)
                .build();

        note1 = Note.builder()
                .id(1L)
                .inscription(inscription)
                .cours(cours1)
                .noteFinale(15.0)
                .noteRetenue(15.0)
                .credits(4)
                .statut(Note.StatutNote.VALIDEE)
                .build();

        note2 = Note.builder()
                .id(2L)
                .inscription(inscription)
                .cours(cours2)
                .noteFinale(12.0)
                .noteRetenue(12.0)
                .credits(3)
                .statut(Note.StatutNote.VALIDEE)
                .build();
    }

    @Test
    void preparer_ShouldCreateDeliberation_WhenNotesExist() {
        // Arrange
        String annee = "2025-2026";

        when(inscriptionRepo.findById(1L)).thenReturn(Optional.of(inscription));
        when(noteRepo.notesValideesPourDeliberation(1L, annee)).thenReturn(List.of(note1, note2));
        when(deliberationRepo.findByInscriptionIdAndAnneeAcademique(1L, annee)).thenReturn(Optional.empty());
        when(deliberationRepo.save(any(Deliberation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Deliberation result = deliberationService.preparer(1L, annee);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getMoyenneGenerale()).isEqualTo(13.71); // (15*4 + 12*3) / 7 = 13.71
        assertThat(result.getCreditsValides()).isEqualTo(7);
        assertThat(result.getDecision()).isEqualTo(Deliberation.DecisionJury.ADMIS);
        assertThat(result.getStatut()).isEqualTo(Deliberation.StatutDeliberation.PRÊTE);
        assertThat(result.getInscription()).isEqualTo(inscription);
        verify(deliberationRepo, times(1)).save(any(Deliberation.class));
    }

    @Test
    void preparer_ShouldThrowException_WhenNoNotes() {
        // Arrange
        String annee = "2025-2026";

        when(inscriptionRepo.findById(1L)).thenReturn(Optional.of(inscription));
        when(noteRepo.notesValideesPourDeliberation(1L, annee)).thenReturn(List.of());

        // Act & Assert
        assertThatThrownBy(() -> deliberationService.preparer(1L, annee))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Aucune note validee pour cet etudiant cette annee");
    }

    @Test
    void preparer_ShouldProposeDiplome_WhenDerniereAnneeEtMoyenneSuffisante() {
        // Arrange
        inscription.setNiveau("L3");
        String annee = "2025-2026";

        when(inscriptionRepo.findById(1L)).thenReturn(Optional.of(inscription));
        when(noteRepo.notesValideesPourDeliberation(1L, annee)).thenReturn(List.of(note1, note2));
        when(deliberationRepo.findByInscriptionIdAndAnneeAcademique(1L, annee)).thenReturn(Optional.empty());
        when(deliberationRepo.save(any(Deliberation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Deliberation result = deliberationService.preparer(1L, annee);

        // Assert
        assertThat(result.getDecision()).isEqualTo(Deliberation.DecisionJury.DIPLOME);
    }

    @Test
    void publier_ShouldUpdateStatus_WhenDeliberationIsTenue() {
        // Arrange
        Deliberation delib = Deliberation.builder()
                .id(1L)
                .statut(Deliberation.StatutDeliberation.TENUE)
                .inscription(inscription)
                .build();

        when(deliberationRepo.findById(1L)).thenReturn(Optional.of(delib));
        when(deliberationRepo.save(any(Deliberation.class))).thenReturn(delib);

        // Act
        Deliberation result = deliberationService.publier(1L);

        // Assert
        assertThat(result.getStatut()).isEqualTo(Deliberation.StatutDeliberation.PUBLIEE);
        assertThat(result.isPubliee()).isTrue();
        assertThat(result.getDatePublication()).isNotNull();
        verify(deliberationRepo, times(1)).save(any(Deliberation.class));
    }

    @Test
    void publier_ShouldThrowException_WhenNotTenue() {
        // Arrange
        Deliberation delib = Deliberation.builder()
                .id(1L)
                .statut(Deliberation.StatutDeliberation.PRÊTE)
                .build();

        when(deliberationRepo.findById(1L)).thenReturn(Optional.of(delib));

        // Act & Assert
        assertThatThrownBy(() -> deliberationService.publier(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("La deliberation doit d'abord etre tenue par le jury");
    }

    @Test
    void statsUniversite_ShouldReturnCorrectStatistics() {
        // Arrange
        String annee = "2025-2026";
        Deliberation d1 = Deliberation.builder()
                .decision(Deliberation.DecisionJury.ADMIS)
                .moyenneGenerale(12.5)
                .build();
        Deliberation d2 = Deliberation.builder()
                .decision(Deliberation.DecisionJury.ADMIS_RATTRAPAGE)
                .moyenneGenerale(8.5)
                .build();
        Deliberation d3 = Deliberation.builder()
                .decision(Deliberation.DecisionJury.REDOUBLE)
                .moyenneGenerale(6.0)
                .build();

        when(deliberationRepo.findByUniversiteIdAndAnneeAcademique(1L, annee))
                .thenReturn(List.of(d1, d2, d3));
        when(deliberationRepo.countAdmis(1L, annee)).thenReturn(1L);
        when(deliberationRepo.countDiplomes(1L, annee)).thenReturn(0L);

        // Act
        Map<String, Object> result = deliberationService.statsUniversite(1L, annee);

        // Assert
        assertThat(result.get("total")).isEqualTo(3);
        assertThat(result.get("admis")).isEqualTo(1);
        assertThat(result.get("diplomes")).isEqualTo(0);
        assertThat(result.get("redoublants")).isEqualTo(1);
        assertThat(result.get("tauxReussite")).isEqualTo(33); // 1/3 = 33%
    }
}