package cd.genuc.service;

import cd.genuc.exception.InscriptionNotFoundException;
import cd.genuc.exception.PaiementNotFoundException;
import cd.genuc.model.*;
import cd.genuc.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaiementServiceTest {

    @Mock
    private PaiementRepository paiementRepo;

    @Mock
    private InscriptionRepository inscriptionRepo;

    @Mock
    private UniversiteRepository universiteRepo;

    @Mock
    private BaremePaiementRepository baremeRepo;

    @Mock
    private DossierInscriptionRepository dossierRepo;

    // Sixième dépendance de PaiementService : sans ce mock, @InjectMocks laisse le
    // champ à null et calculerMontantAttendu() lève un NullPointerException.
    @Mock
    private cd.genuc.repository.AffectationFraisRepository affectationRepo;

    @InjectMocks
    private PaiementService paiementService;

    private Inscription inscription;
    private Universite universite;
    private Paiement paiement;
    private BaremePaiement bareme;

    @BeforeEach
    void setUp() {
        universite = Universite.builder()
                .id(1L)
                .nom("Université de Kinshasa")
                .code("UNIKIN")
                .fraisBase(380.0)
                .build();

        inscription = Inscription.builder()
                .id(1L)
                .matricule("UNIKIN202600001")
                .nom("MBEMBA")
                .prenom("Jean")
                .email("jean.mbemba@unikin.cd")
                .universite(universite)
                .statut(StatutInscription.VALIDE)
                .build();

        bareme = BaremePaiement.builder()
                .id(1L)
                .anneeAcademique("2025-2026")
                .niveau("L1")
                .typePaiement(Paiement.TypePaiement.FRAIS_ACADEMIQUES)
                .montantAttendu(380.0)
                .devise("USD")
                .universite(universite)
                .actif(true)
                .build();

        paiement = Paiement.builder()
                .id(1L)
                .reference("GEN-2025-00001")
                .montant(380.0)
                .devise("USD")
                .modePaiement(Paiement.ModePaiement.ESPECES)
                .statut(Paiement.StatutPaiement.EN_ATTENTE)
                .type(Paiement.TypePaiement.FRAIS_ACADEMIQUES)
                .datePaiement(LocalDate.now())
                .inscription(inscription)
                .universite(universite)
                .build();
    }

    @Test
    void soumettre_ShouldCreatePaiement_WhenValidData() {
        // Arrange
        Map<String, Object> data = new HashMap<>();
        data.put("inscriptionId", 1L);
        data.put("universiteId", 1L);
        data.put("montant", 380.0);
        data.put("type", "FRAIS_ACADEMIQUES");
        data.put("modePaiement", "ESPECES");
        data.put("agentId", 10L);

        when(inscriptionRepo.findById(1L)).thenReturn(Optional.of(inscription));
        when(universiteRepo.findById(1L)).thenReturn(Optional.of(universite));
        when(paiementRepo.countParAnnee(anyInt())).thenReturn(0L);
        // Renvoyer l'argument (et non une fixture figée) pour vérifier ce que le service a réellement construit
        when(paiementRepo.save(any(Paiement.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        Paiement result = paiementService.soumettre(data);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getReference()).isEqualTo("GEN-" + LocalDate.now().getYear() + "-00001");
        assertThat(result.getStatut()).isEqualTo(Paiement.StatutPaiement.VALIDE); // Agent + Espèces => validation automatique
        verify(paiementRepo, times(1)).save(any(Paiement.class));
    }

    @Test
    void soumettre_ShouldThrowException_WhenInscriptionNotFound() {
        // Arrange
        Map<String, Object> data = new HashMap<>();
        data.put("inscriptionId", 999L);
        data.put("universiteId", 1L);
        data.put("montant", 380.0);

        when(inscriptionRepo.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> paiementService.soumettre(data))
                .isInstanceOf(InscriptionNotFoundException.class)
                .hasMessageContaining("Inscription non trouvée");
    }

    @Test
    void soumettre_ShouldThrowException_WhenInscriptionNotValidated() {
        // Arrange
        inscription.setStatut(StatutInscription.EN_ATTENTE);
        Map<String, Object> data = new HashMap<>();
        data.put("inscriptionId", 1L);
        data.put("universiteId", 1L);
        data.put("montant", 380.0);

        when(inscriptionRepo.findById(1L)).thenReturn(Optional.of(inscription));
        when(universiteRepo.findById(1L)).thenReturn(Optional.of(universite));

        // Act & Assert
        assertThatThrownBy(() -> paiementService.soumettre(data))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Impossible de payer pour une inscription non validee");
    }

    @Test
    void valider_ShouldUpdateStatus_WhenPaiementIsEnAttente() {
        // Arrange
        paiement.setStatut(Paiement.StatutPaiement.EN_ATTENTE);
        when(paiementRepo.findById(1L)).thenReturn(Optional.of(paiement));
        when(paiementRepo.save(any(Paiement.class))).thenReturn(paiement);

        // Act
        Paiement result = paiementService.valider(1L, 10L, "OK");

        // Assert
        assertThat(result.getStatut()).isEqualTo(Paiement.StatutPaiement.VALIDE);
        assertThat(result.getDateValidation()).isNotNull();
        verify(paiementRepo, times(1)).save(any(Paiement.class));
    }

    @Test
    void valider_ShouldThrowException_WhenPaiementAlreadyValide() {
        // Arrange
        paiement.setStatut(Paiement.StatutPaiement.VALIDE);
        when(paiementRepo.findById(1L)).thenReturn(Optional.of(paiement));

        // Act & Assert
        assertThatThrownBy(() -> paiementService.valider(1L, 10L, "OK"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Ce paiement n'est pas en attente");
    }

    @Test
    void obtenir_ShouldReturnPaiement_WhenExists() {
        // Arrange
        when(paiementRepo.findById(1L)).thenReturn(Optional.of(paiement));

        // Act
        Paiement result = paiementService.obtenir(1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getReference()).isEqualTo("GEN-2025-00001");
    }

    @Test
    void obtenir_ShouldThrowException_WhenNotFound() {
        // Arrange
        when(paiementRepo.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> paiementService.obtenir(999L))
                .isInstanceOf(PaiementNotFoundException.class)
                .hasMessageContaining("Paiement non trouvé");
    }

    @Test
    void situationFinanciere_ShouldReturnCompleteSituation() {
        // Arrange
        when(inscriptionRepo.findById(1L)).thenReturn(Optional.of(inscription));
        when(paiementRepo.findByInscriptionId(1L)).thenReturn(List.of(paiement));
        when(paiementRepo.totalValideParInscription(1L)).thenReturn(380.0);
        when(baremeRepo.findBareme(anyLong(), anyString(), anyString(), any(Paiement.TypePaiement.class)))
                .thenReturn(List.of(bareme));

        // Act
        Map<String, Object> result = paiementService.situationFinanciere(1L);

        // Assert
        assertThat(result).containsKey("matricule");
        assertThat(result.get("matricule")).isEqualTo("UNIKIN202600001");
        assertThat(result.get("montantAttendu")).isEqualTo(380.0);
        assertThat(result.get("totalPaye")).isEqualTo(380.0);
        assertThat(result.get("soldeRestant")).isEqualTo(0.0);
        assertThat(result.get("estSolde")).isEqualTo(true);
    }

    @Test
    void paiementsParInscriptionPagines_ShouldReturnPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Paiement> page = new PageImpl<>(List.of(paiement), pageable, 1);
        when(paiementRepo.findByInscriptionId(1L, pageable)).thenReturn(page);

        // Act
        Page<Paiement> result = paiementService.paiementsParInscriptionPagines(1L, pageable);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getReference()).isEqualTo("GEN-2025-00001");
    }
}