package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.OperationCaisse.TypeOperation;
import cd.genuc.repository.OperationCaisseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OperationCaisseService {

    private final OperationCaisseRepository operationRepo;

    /**
     * Enregistre une opération de caisse
     */
    @Transactional
    public OperationCaisse enregistrerOperation(Caisse caisse, Paiement paiement, Depense depense,
                                                Double montant, OperationCaisse.TypeOperation type,
                                                Long operateurId, String reference, String description,
                                                Double soldeApresOperation) {
        OperationCaisse operation = OperationCaisse.builder()
                .caisse(caisse)
                .paiement(paiement)
                .depense(depense)
                .montant(montant)
                .type(type)
                .operateurId(operateurId)
                .reference(reference)
                .description(description)
                .soldeApresOperation(soldeApresOperation)
                .build();
        return operationRepo.save(operation);
    }

    /**
     * Récupère toutes les opérations d'une caisse
     */
    public List<OperationCaisse> getOperationsParCaisse(Long caisseId) {
        return operationRepo.findByCaisseIdOrderByDateOperationDesc(caisseId);
    }

    /**
     * Récupère les opérations d'une caisse par type
     */
    public List<OperationCaisse> getOperationsParType(Long caisseId, OperationCaisse.TypeOperation type) {
        return operationRepo.findByCaisseIdAndTypeOrderByDateOperationDesc(caisseId, type);
    }

    /**
     * Récupère les opérations sur une période
     */
    public List<OperationCaisse> getOperationsParPeriode(Long caisseId, LocalDateTime debut, LocalDateTime fin) {
        return operationRepo.findByCaisseIdAndDateOperationBetweenOrderByDateOperationDesc(caisseId, debut, fin);
    }

    /**
     * Récupère le solde de la caisse (total encaissements - total sorties)
     */
    public Map<String, Object> getSoldeCaisse(Long caisseId) {
        Double encaissements = operationRepo.sumEncaissementsByCaisse(caisseId);
        Double sorties = operationRepo.sumSortiesByCaisse(caisseId);
        if (encaissements == null) encaissements = 0.0;
        if (sorties == null) sorties = 0.0;

        Map<String, Object> solde = new LinkedHashMap<>();
        solde.put("totalEncaissements", encaissements);
        solde.put("totalSorties", sorties);
        solde.put("solde", encaissements - sorties);
        return solde;
    }

	public OperationCaisse enregistrerOperation(Long caisseId, TypeOperation type, Double montant, String reference,
			String description, Long effectueParId) {
		// TODO Auto-generated method stub
		return null;
	}
}