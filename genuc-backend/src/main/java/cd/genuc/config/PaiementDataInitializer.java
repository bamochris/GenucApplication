package cd.genuc.config;

import cd.genuc.model.BaremePaiement;
import cd.genuc.model.Paiement.TypePaiement;
import cd.genuc.model.Universite;
import cd.genuc.repository.BaremePaiementRepository;
import cd.genuc.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;

import java.time.LocalDate;

/**
 * Initialise les barèmes de paiement de démonstration
 */
@Slf4j
@Configuration
@Profile("!prod")
@Order(2)  // Exécuté après DataInitializer (Order(1))
@RequiredArgsConstructor
public class PaiementDataInitializer {

    private final BaremePaiementRepository baremeRepo;
    private final UniversiteRepository universiteRepo;

    @Bean
    public CommandLineRunner initialiserBaremes() {
        return args -> {
            if (baremeRepo.count() == 0) {
                // Récupérer toutes les universités existantes (devraient être créées par DataInitializer)
                universiteRepo.findAll().forEach(uni -> creerBaremesUni(uni));
                log.info("✅ Barèmes de paiement créés pour toutes les universités");
            } else {
                log.info("ℹ️ Des barèmes existent déjà, création ignorée.");
            }
        };
    }

    private void creerBaremesUni(Universite uni) {
        int annee = LocalDate.now().getYear();
        String anneeAcad = annee + "-" + (annee + 1);
        double base = uni.getFraisBase();

        // Frais académiques par niveau (sans vacation)
        String[][] niveaux = {{"L1", "L2", "L3"}, {"M1", "M2"}, {"D1", "D2", "D3"}};
        double[] coeffNiveau = {1.0, 1.2, 1.5};   // L1 base, L2 1.2, L3/D etc.

        int i = 0;
        for (String[] groupe : niveaux) {
            double coeffN = coeffNiveau[i++];
            for (String niveau : groupe) {
                double montant = Math.round(base * coeffN);
                
                // Enregistrement des frais académiques globaux pour ce niveau
                baremeRepo.save(BaremePaiement.builder()
                    .anneeAcademique(anneeAcad)
                    .niveau(niveau)
                    .typePaiement(TypePaiement.FRAIS_ACADEMIQUES)
                    .montantAttendu(montant)
                    .devise("USD")
                    .universite(uni)
                    .actif(true)
                    .build());

                // Frais d'inscription (une seule fois, L1 uniquement)
                if ("L1".equals(niveau)) {
                    baremeRepo.save(BaremePaiement.builder()
                        .anneeAcademique(anneeAcad)
                        .niveau("L1")
                        .typePaiement(TypePaiement.FRAIS_INSCRIPTION)
                        .montantAttendu(50.0)
                        .devise("USD")
                        .universite(uni)
                        .actif(true)
                        .build());
                }
            }
        }
    }
}