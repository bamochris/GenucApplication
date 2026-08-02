// cd.genuc.service.RemboursementService.java
package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RemboursementService {

    private final RemboursementRepository remboursementRepo;
    private final PaiementRepository paiementRepo;
    private final EtudiantRepository etudiantRepo;
    private final InscriptionRepository inscriptionRepo;

    // ÉTAPE 1: ÉTUDIANT - Demander un remboursement
    @Transactional
    public Remboursement demander(Long paiementId, Long etudiantId, String motif) {
        Paiement paiement = paiementRepo.findById(paiementId)
            .orElseThrow(() -> new RuntimeException("Paiement introuvable"));
        
        if (paiement.getStatut() != Paiement.StatutPaiement.VALIDE) {
            throw new RuntimeException("Seuls les paiements validés peuvent être remboursés");
        }
        
        // Vérifier que l'étudiant est bien le propriétaire
        Inscription inscription = paiement.getInscription();
        if (!inscription.getEtudiant().getId().equals(etudiantId)) {
            throw new RuntimeException("Ce paiement ne vous appartient pas");
        }
        
        // Vérifier s'il existe déjà une demande
        List<Remboursement> existants = remboursementRepo.findByEtudiantId(etudiantId);
        boolean demandeExistante = existants.stream()
            .anyMatch(r -> r.getPaiement().getId().equals(paiementId) 
                && r.getStatut() != Remboursement.StatutRemboursement.EXECUTE
                && r.getStatut() != Remboursement.StatutRemboursement.REJETE);
        
        if (demandeExistante) {
            throw new RuntimeException("Une demande de remboursement existe déjà pour ce paiement");
        }
        
        Remboursement remboursement = Remboursement.builder()
            .paiement(paiement)
            .etudiant(inscription.getEtudiant())
            .montant(paiement.getMontant())
            .motif(motif)
            .statut(Remboursement.StatutRemboursement.EN_ATTENTE)
            .demandeurId(etudiantId)
            .build();
        
        return remboursementRepo.save(remboursement);
    }
    
    // ÉTAPE 2: CAISSIER - Vérifier la demande
    @Transactional
    public Remboursement verifier(Long id, Long caissierId, String commentaire) {
        Remboursement r = obtenir(id);
        
        if (r.getStatut() != Remboursement.StatutRemboursement.EN_ATTENTE) {
            throw new RuntimeException("Cette demande n'est plus en attente");
        }
        
        r.setStatut(Remboursement.StatutRemboursement.VERIFIE);
        r.setVerificateurId(caissierId);
        r.setDateVerification(LocalDateTime.now());
        r.setCommentaireVerification(commentaire);
        
        return remboursementRepo.save(r);
    }
    
    // ÉTAPE 3: CHEF DEPARTEMENT - Valider le motif
    @Transactional
    public Remboursement validerMotif(Long id, Long chefId, String commentaire) {
        Remboursement r = obtenir(id);
        
        if (r.getStatut() != Remboursement.StatutRemboursement.VERIFIE) {
            throw new RuntimeException("La demande doit d'abord être vérifiée par la caisse");
        }
        
        r.setStatut(Remboursement.StatutRemboursement.MOTIF_VALIDE);
        r.setValidateurMotifId(chefId);
        r.setDateValidationMotif(LocalDateTime.now());
        r.setCommentaireValidationMotif(commentaire);
        
        return remboursementRepo.save(r);
    }
    
    // ÉTAPE 4: ADMIN_UNIVERSITE - Autoriser le remboursement
    @Transactional
    public Remboursement autoriser(Long id, Long adminId, String commentaire) {
        Remboursement r = obtenir(id);
        
        if (r.getStatut() != Remboursement.StatutRemboursement.MOTIF_VALIDE) {
            throw new RuntimeException("Le motif doit d'abord être validé par le chef de département");
        }
        
        r.setStatut(Remboursement.StatutRemboursement.AUTORISE);
        r.setAutorisateurId(adminId);
        r.setDateAutorisation(LocalDateTime.now());
        r.setCommentaireAutorisation(commentaire);
        
        return remboursementRepo.save(r);
    }
    
    // ÉTAPE 5: CAISSIER - Exécuter le remboursement
    @Transactional
    public Remboursement executer(Long id, Long caissierId, String reference) {
        Remboursement r = obtenir(id);
        
        if (r.getStatut() != Remboursement.StatutRemboursement.AUTORISE) {
            throw new RuntimeException("La demande doit d'abord être autorisée");
        }
        
        r.setStatut(Remboursement.StatutRemboursement.EXECUTE);
        r.setExecuteurId(caissierId);
        r.setDateExecution(LocalDateTime.now());
        r.setReferenceRemboursement(reference != null ? reference : "REM-" + UUID.randomUUID().toString().substring(0, 8));
        
        // Optionnel: Mettre à jour le statut du paiement
        Paiement paiement = r.getPaiement();
        paiement.setStatut(Paiement.StatutPaiement.REMBOURSE);
        paiementRepo.save(paiement);
        
        return remboursementRepo.save(r);
    }
    
    // Rejeter à n'importe quelle étape
    @Transactional
    public Remboursement rejeter(Long id, Long agentId, String motif) {
        Remboursement r = obtenir(id);
        r.setStatut(Remboursement.StatutRemboursement.REJETE);
        r.setCommentaireAutorisation(motif);
        return remboursementRepo.save(r);
    }
    
    public Remboursement obtenir(Long id) {
        return remboursementRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Remboursement introuvable"));
    }
    
    public List<Remboursement> getByEtudiant(Long etudiantId) {
        return remboursementRepo.findByEtudiantId(etudiantId);
    }
    
    public Map<String, Object> getSuivi(Long etudiantId) {
        List<Remboursement> demandes = getByEtudiant(etudiantId);
        
        return Map.of(
            "total", demandes.size(),
            "enAttente", demandes.stream().filter(d -> d.getStatut() == Remboursement.StatutRemboursement.EN_ATTENTE).count(),
            "verifie", demandes.stream().filter(d -> d.getStatut() == Remboursement.StatutRemboursement.VERIFIE).count(),
            "motifValide", demandes.stream().filter(d -> d.getStatut() == Remboursement.StatutRemboursement.MOTIF_VALIDE).count(),
            "autorise", demandes.stream().filter(d -> d.getStatut() == Remboursement.StatutRemboursement.AUTORISE).count(),
            "execute", demandes.stream().filter(d -> d.getStatut() == Remboursement.StatutRemboursement.EXECUTE).count(),
            "rejete", demandes.stream().filter(d -> d.getStatut() == Remboursement.StatutRemboursement.REJETE).count(),
            "demandes", demandes
        );
    }
}