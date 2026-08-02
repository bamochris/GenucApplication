// src/test/java/cd/genuc/service/UniversiteServiceTest.java
package cd.genuc.service;

import cd.genuc.model.Universite;
import cd.genuc.repository.UniversiteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UniversiteServiceTest {

    @Mock
    private UniversiteRepository universiteRepository;

    @InjectMocks
    private UniversiteService universiteService;

    private Universite universite;
    private Map<String, Object> universiteData;

    @BeforeEach
    void setUp() {
        universite = Universite.builder()
            .id(1L)
            .nom("Université de Kinshasa")
            .code("UNIKIN")
            .ville("Kinshasa")
            .fraisBase(380.0)
            .inscriptionsOuvertes(true)
            .actif(true)
            .build();

        universiteData = new HashMap<>();
        universiteData.put("nom", "Université de Lubumbashi");
        universiteData.put("code", "UNILU");
        universiteData.put("ville", "Lubumbashi");
        universiteData.put("fraisBase", 350.0);
        universiteData.put("email", "contact@unilu.cd");
    }

    @Test
    void testCreerUniversite_ShouldCreate() {
        when(universiteRepository.existsByCode(anyString())).thenReturn(false);
        when(universiteRepository.save(any(Universite.class))).thenReturn(universite);

        Universite result = universiteService.creer(universiteData);

        assertNotNull(result);
        assertEquals("UNIKIN", result.getCode());
        verify(universiteRepository, times(1)).save(any(Universite.class));
    }

    @Test
    void testCreerUniversite_CodeExists_ShouldThrowException() {
        when(universiteRepository.existsByCode(anyString())).thenReturn(true);

        assertThrows(RuntimeException.class, () -> {
            universiteService.creer(universiteData);
        });
    }

    @Test
    void testObtenirUniversite_ShouldReturn() {
        when(universiteRepository.findById(1L)).thenReturn(Optional.of(universite));

        Universite result = universiteService.obtenir(1L);

        assertNotNull(result);
        assertEquals("UNIKIN", result.getCode());
    }

    @Test
    void testObtenirUniversite_NotFound_ShouldThrowException() {
        when(universiteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            universiteService.obtenir(99L);
        });
    }

    @Test
    void testToggleInscriptions_ShouldToggle() {
        when(universiteRepository.findById(1L)).thenReturn(Optional.of(universite));
        when(universiteRepository.save(any(Universite.class))).thenReturn(universite);

        boolean avant = universite.isInscriptionsOuvertes();
        Universite result = universiteService.toggleInscriptions(1L);
        boolean apres = result.isInscriptionsOuvertes();

        assertNotEquals(avant, apres);
    }
}