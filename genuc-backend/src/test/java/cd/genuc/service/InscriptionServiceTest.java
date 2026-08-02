package cd.genuc.service;

import cd.genuc.dto.InscriptionRequest;
import cd.genuc.exception.BusinessException;
import cd.genuc.exception.InscriptionNotFoundException;
import cd.genuc.exception.UniversiteNotFoundException;
import cd.genuc.model.*;
import cd.genuc.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InscriptionServiceTest {

    @Mock
    private InscriptionRepository inscriptionRepo;

    @Mock
    private UniversiteRepository universiteRepo;

    @Mock
    private EtudiantRepository etudiantRepo;

    @Mock
    private FiliereRepository filiereRepo;

    @Mock
    private PromotionRepository promotionRepo;

    @Mock
    private AnneeAcademiqueRepository anneeRepo;

    @Mock
    private DepartementRepository departementRepo;

    @InjectMocks
    private InscriptionService inscriptionService;

    private Universite universite;
    private Departement departement;
    private Filiere filiere;
    private Promotion promotion;
    private AnneeAcademique annee;
    private Etudiant etudiant;
    private InscriptionRequest request;

    @BeforeEach
    void setUp() {
        universite = Universite.builder()
                .id(1L)
                .nom("Université de Kinshasa")
                .code("UNIKIN")
                .inscriptionsOuvertes(true)
                .build();

        departement = Departement.builder()
                .id(1L)
                .nom("Département Informatique")
                .code("INFO")
                .faculte(Faculte.builder().id(1L).universite(universite).build())
                .universite(universite)
                .build();

        filiere = Filiere.builder()
                .id(1L)
                .nom("Informatique de Gestion")
                .code("INFO-GEST")
                .departement(departement)
                .build();

        promotion = Promotion.builder()
                .id(1L)
                .libelle("L1")
                .filiere(filiere)
                .build();

        annee = AnneeAcademique.builder()
                .id(1L)
                .libelle("2025-2026")
                .active(true)
                .build();

        etudiant = Etudiant.builder()
                .id(1L)
                .nom("KASONGO")
                .prenom("Marie")
                .email("marie.kasongo@email.com")
                .telephone("+243 81 000 0001")
                .build();

        request = new InscriptionRequest();
        request.setUniversiteId(1L);
        request.setDepartementId(1L);
        request.setEtudiantId(1L);
        request.setFiliereId(1L);
        request.setPromotionId(1L);
        request.setAnneeAcademiqueId(1L);
    }

    @Test
    void soumettre_ShouldCreateInscription_WhenValidData() {
        // Arrange
        when(universiteRepo.findById(1L)).thenReturn(Optional.of(universite));
        when(departementRepo.findById(1L)).thenReturn(Optional.of(departement));
        when(filiereRepo.findById(1L)).thenReturn(Optional.of(filiere));
        when(promotionRepo.findById(1L)).thenReturn(Optional.of(promotion));
        when(anneeRepo.findById(1L)).thenReturn(Optional.of(annee));
        when(etudiantRepo.findById(1L)).thenReturn(Optional.of(etudiant));
        when(inscriptionRepo.countByUniversite_IdAndAnneeAcademique_Id(anyLong(), anyLong())).thenReturn(0L);
        when(inscriptionRepo.save(any(Inscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Inscription result = inscriptionService.soumettre(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getStatut()).isEqualTo(StatutInscription.EN_ATTENTE);
        assertThat(result.getMatricule()).isEqualTo("UNIKIN202500001");
        assertThat(result.getEtudiant().getEmail()).isEqualTo("marie.kasongo@email.com");
        verify(inscriptionRepo, times(1)).save(any(Inscription.class));
    }

    @Test
    void soumettre_ShouldThrowUniversiteNotFoundException_WhenUniversiteNotFound() {
        // Arrange
        when(universiteRepo.findById(999L)).thenReturn(Optional.empty());
        request.setUniversiteId(999L);

        // Act & Assert
        assertThatThrownBy(() -> inscriptionService.soumettre(request))
                .isInstanceOf(UniversiteNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    void soumettre_ShouldThrowBusinessException_WhenInscriptionsClosed() {
        // Arrange
        universite.setInscriptionsOuvertes(false);
        when(universiteRepo.findById(1L)).thenReturn(Optional.of(universite));
        when(departementRepo.findById(1L)).thenReturn(Optional.of(departement));
        when(filiereRepo.findById(1L)).thenReturn(Optional.of(filiere));
        when(promotionRepo.findById(1L)).thenReturn(Optional.of(promotion));
        when(anneeRepo.findById(1L)).thenReturn(Optional.of(annee));
        when(etudiantRepo.findById(1L)).thenReturn(Optional.of(etudiant));

        // Act & Assert
        assertThatThrownBy(() -> inscriptionService.soumettre(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("fermées");
    }

    @Test
    void valider_ShouldUpdateStatus_WhenInscriptionIsEnAttente() {
        // Arrange
        Inscription inscription = Inscription.builder()
                .id(1L)
                .statut(StatutInscription.EN_ATTENTE)
                .etudiant(etudiant)
                .universite(universite)
                .build();

        when(inscriptionRepo.findById(1L)).thenReturn(Optional.of(inscription));
        when(inscriptionRepo.save(any(Inscription.class))).thenReturn(inscription);

        // Act
        Inscription result = inscriptionService.valider(1L, "Dossier complet");

        // Assert
        assertThat(result.getStatut()).isEqualTo(StatutInscription.VALIDE);
        assertThat(result.getCommentaire()).isEqualTo("Dossier complet");
        verify(inscriptionRepo, times(1)).save(any(Inscription.class));
    }

    @Test
    void valider_ShouldThrowException_WhenAlreadyValide() {
        // Arrange
        Inscription inscription = Inscription.builder()
                .id(1L)
                .statut(StatutInscription.VALIDE)
                .build();

        when(inscriptionRepo.findById(1L)).thenReturn(Optional.of(inscription));

        // Act & Assert
        assertThatThrownBy(() -> inscriptionService.valider(1L, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Seules les inscriptions en attente peuvent être validées");
    }

    @Test
    void rejeter_ShouldUpdateStatusAndMotif() {
        // Arrange
        Inscription inscription = Inscription.builder()
                .id(1L)
                .statut(StatutInscription.EN_ATTENTE)
                .build();

        when(inscriptionRepo.findById(1L)).thenReturn(Optional.of(inscription));
        when(inscriptionRepo.save(any(Inscription.class))).thenReturn(inscription);

        // Act
        Inscription result = inscriptionService.rejeter(1L, "Dossier incomplet");

        // Assert
        assertThat(result.getStatut()).isEqualTo(StatutInscription.REJETE);
        assertThat(result.getMotifRejet()).isEqualTo("Dossier incomplet");
        verify(inscriptionRepo, times(1)).save(any(Inscription.class));
    }
}