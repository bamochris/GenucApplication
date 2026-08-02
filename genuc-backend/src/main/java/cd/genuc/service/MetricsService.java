package cd.genuc.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Métriques métier GENUC exposées à Prometheus via /actuator/prometheus.
 *
 * Visibles dans Grafana sous le préfixe "genuc_".
 *
 * Compteurs (toujours croissants) :
 *   genuc_paiements_total{statut, mode, universite}
 *   genuc_bons_generes_total{universite}
 *   genuc_notifications_total{type, statut}
 *   genuc_connexions_total{role}
 *   genuc_erreurs_paiement_total{provider}
 *
 * Jauges (valeur instantanée) :
 *   genuc_etudiants_actifs
 *   genuc_paiements_en_attente
 *
 * Timers (latence) :
 *   genuc_generation_pdf_seconds{type}
 *   genuc_webhook_traitement_seconds{provider}
 */
@Service
@Slf4j
public class MetricsService {

    private final MeterRegistry registry;

    // Jauges — valeurs atomiques mises à jour périodiquement
    private final AtomicLong etudiantsActifs     = new AtomicLong(0);
    private final AtomicLong paiementsEnAttente  = new AtomicLong(0);

    public MetricsService(MeterRegistry registry) {
        this.registry = registry;
        enregistrerJauges();
    }

    // ─── Paiements ──────────────────────────────────────────────────────────

    public void paiementValide(String modePaiement, String universiteCode) {
        compteur("genuc.paiements",
                "statut", "VALIDE",
                "mode", modePaiement,
                "universite", universiteCode)
            .increment();
    }

    public void paiementRejete(String modePaiement, String universiteCode) {
        compteur("genuc.paiements",
                "statut", "REJETE",
                "mode", modePaiement,
                "universite", universiteCode)
            .increment();
    }

    public void erreurPaiement(String provider) {
        compteur("genuc.erreurs.paiement", "provider", provider).increment();
    }

    // ─── Bons de paiement ───────────────────────────────────────────────────

    public void bonGenere(String universiteCode) {
        compteur("genuc.bons.generes", "universite", universiteCode).increment();
    }

    public void bonValide(String universiteCode) {
        compteur("genuc.bons.valides", "universite", universiteCode).increment();
    }

    // ─── Notifications ──────────────────────────────────────────────────────

    public void notificationEnvoyee(String type) {
        compteur("genuc.notifications", "type", type, "statut", "OK").increment();
    }

    public void notificationEchouee(String type) {
        compteur("genuc.notifications", "type", type, "statut", "ECHEC").increment();
    }

    // ─── Authentification ────────────────────────────────────────────────────

    public void connexionReussie(String role) {
        compteur("genuc.connexions", "role", role, "statut", "OK").increment();
    }

    public void connexionEchouee() {
        compteur("genuc.connexions", "role", "INCONNU", "statut", "ECHEC").increment();
    }

    // ─── PDFs ────────────────────────────────────────────────────────────────

    public Timer.Sample demarrerTimerPdf() {
        return Timer.start(registry);
    }

    public void arreterTimerPdf(Timer.Sample sample, String typePdf, boolean succes) {
        sample.stop(Timer.builder("genuc.generation.pdf")
                .description("Durée de génération des PDFs")
                .tag("type", typePdf)
                .tag("succes", String.valueOf(succes))
                .register(registry));
    }

    // ─── Webhooks ────────────────────────────────────────────────────────────

    public Timer.Sample demarrerTimerWebhook() {
        return Timer.start(registry);
    }

    public void arreterTimerWebhook(Timer.Sample sample, String provider, boolean succes) {
        sample.stop(Timer.builder("genuc.webhook.traitement")
                .description("Durée de traitement des webhooks paiement")
                .tag("provider", provider)
                .tag("succes", String.valueOf(succes))
                .register(registry));
    }

    // ─── Jauges (mises à jour par un scheduler) ──────────────────────────────

    public void mettreAJourEtudiantsActifs(long count) {
        etudiantsActifs.set(count);
    }

    public void mettreAJourPaiementsEnAttente(long count) {
        paiementsEnAttente.set(count);
    }

    // ─── Helpers privés ──────────────────────────────────────────────────────

    private Counter compteur(String name, String... tags) {
        return Counter.builder(name)
                .tags(tags)
                .register(registry);
    }

    private void enregistrerJauges() {
        Gauge.builder("genuc.etudiants.actifs", etudiantsActifs, AtomicLong::doubleValue)
                .description("Nombre d'étudiants avec une inscription active")
                .register(registry);

        Gauge.builder("genuc.paiements.en.attente", paiementsEnAttente, AtomicLong::doubleValue)
                .description("Nombre de paiements en attente de confirmation")
                .register(registry);
    }
}
