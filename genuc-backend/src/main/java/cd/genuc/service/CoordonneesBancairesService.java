package cd.genuc.service;

import cd.genuc.model.InformationBancaire;
import cd.genuc.repository.InformationBancaireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Comptes bancaires d'un établissement, mis en forme pour l'affichage.
 *
 * <p>Un étudiant n'est pas obligé de passer par la caisse ni par TachPay : il peut
 * régler son bon au guichet d'une banque partenaire (Equity BCDC, FBN Bank, UBA,
 * Rawbank, TMB…). Encore faut-il que le bon lui dise <b>où</b> — jusqu'ici les
 * coordonnées n'existaient que dans le contenu du QR code, donc illisibles sans
 * scanner.</p>
 *
 * <p>Les banques sont configurées par établissement ({@code InformationBancaire},
 * écran « Comptes bancaires » de l'admin université) : rien n'est codé en dur, un
 * établissement peut donc référencer n'importe quelle banque congolaise.</p>
 *
 * <p>Ce service existe pour éviter que {@code BonDePaiementService} et
 * {@code TachPayPaiementService} — qui alimentent le même générateur PDF — ne
 * dupliquent chacun la même mise en forme.</p>
 */
@Service
@RequiredArgsConstructor
public class CoordonneesBancairesService {

    private final InformationBancaireRepository informationBancaireRepository;

    /**
     * Comptes actifs d'un établissement, prêts à être posés sur le bon.
     *
     * <p>Ordonnés par devise (USD d'abord, la devise de référence des frais) puis par
     * nom, pour que deux bons du même établissement listent toujours les banques dans
     * le même ordre — un caissier repère ainsi une anomalie du premier coup d'œil.</p>
     *
     * @return liste éventuellement vide, jamais {@code null}
     */
    public List<Map<String, String>> pourAffichage(Long universiteId) {
        return pourAffichage(universiteId, java.util.Set.of());
    }

    /**
     * Même chose, restreinte aux comptes ouverts par l'admin pour les frais concernés.
     *
     * @param banquesAutorisees identifiants de comptes retenus ; <b>ensemble vide =
     *                          aucune restriction</b>, tous les comptes actifs sont
     *                          proposés (cas des frais créés avant cette option)
     */
    public List<Map<String, String>> pourAffichage(Long universiteId, java.util.Set<Long> banquesAutorisees) {
        if (universiteId == null) {
            return List.of();
        }
        List<InformationBancaire> comptes =
                informationBancaireRepository.findByUniversiteIdAndActifTrue(universiteId);

        if (banquesAutorisees != null && !banquesAutorisees.isEmpty()) {
            comptes = comptes.stream()
                    .filter(c -> banquesAutorisees.contains(c.getId()))
                    .toList();
        }

        List<Map<String, String>> resultat = new ArrayList<>();
        comptes.stream()
                .sorted(Comparator
                        .comparing((InformationBancaire c) -> "USD".equalsIgnoreCase(c.getDevise()) ? 0 : 1)
                        .thenComparing(c -> c.getNomBanque() == null ? "" : c.getNomBanque()))
                .forEach(compte -> {
                    Map<String, String> ligne = new LinkedHashMap<>();
                    ligne.put("nom", valeur(compte.getNomBanque()));
                    ligne.put("compte", valeur(compte.getNumeroCompte()));
                    ligne.put("devise", valeur(compte.getDevise()));
                    ligne.put("intitule", valeur(compte.getIntituleCompte()));
                    resultat.add(ligne);
                });
        return resultat;
    }

    /**
     * Identifiants des comptes actifs d'un établissement.
     *
     * <p>Sert de valeur par défaut quand un frais n'impose aucune banque : le
     * regroupement des frais en bons a besoin d'ensembles concrets à intersecter,
     * pas d'un « ensemble vide qui signifie tout ».</p>
     */
    public java.util.Set<Long> identifiantsComptesActifs(Long universiteId) {
        if (universiteId == null) {
            return java.util.Set.of();
        }
        return informationBancaireRepository.findByUniversiteIdAndActifTrue(universiteId).stream()
                .map(InformationBancaire::getId)
                .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    private String valeur(String v) {
        return v == null ? "" : v.trim();
    }
}
