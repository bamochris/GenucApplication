package cd.genuc.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.aop.interceptor.SimpleAsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * Exécution asynchrone des notifications.
 *
 * <p>Cette configuration n'existait pas. Conséquences constatées en production
 * le 03/08/2026 :</p>
 *
 * <ul>
 *   <li>Le dépôt d'un dossier d'inscription et la création d'un compte
 *       renvoyaient <b>504 Gateway Time-out</b>. L'enregistrement aboutissait
 *       pourtant : c'est l'envoi du courriel qui bloquait la requête au-delà du
 *       délai de la passerelle. Le candidat voyait une erreur et pouvait
 *       resoumettre — pour s'entendre répondre qu'un dossier existait déjà.</li>
 *   <li>{@code @Async} était employé dans DeliberationService sans que rien ne
 *       l'active : sans {@code @EnableAsync}, l'annotation est inerte et la
 *       délibération en lot s'exécutait dans le fil de la requête.</li>
 * </ul>
 *
 * <p>Le pool est volontairement borné, file comprise : une panne SMTP ne doit
 * pas accumuler des tâches jusqu'à épuiser la mémoire. Au-delà, la politique
 * {@link ThreadPoolExecutor.CallerRunsPolicy} fait exécuter la tâche par
 * l'appelant — on ralentit plutôt que de perdre silencieusement une
 * notification.</p>
 */
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Bean(name = "notificationsExecutor")
    public TaskExecutor notificationsExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("genuc-notif-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        // À l'arrêt, laisser partir ce qui est en cours plutôt que de couper au
        // milieu d'un envoi : le redéploiement attend au plus 20 secondes.
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        executor.initialize();
        return executor;
    }

    @Override
    public Executor getAsyncExecutor() {
        return notificationsExecutor();
    }

    /**
     * Sans ce gestionnaire, une exception levée dans une méthode {@code @Async}
     * de type void disparaît sans laisser de trace : personne ne saurait qu'un
     * courriel d'activation n'est jamais parti.
     */
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return new AsyncUncaughtExceptionHandler() {
            private final AsyncUncaughtExceptionHandler defaut = new SimpleAsyncUncaughtExceptionHandler();

            @Override
            public void handleUncaughtException(Throwable ex, Method methode, Object... params) {
                log.error("Notification asynchrone en échec — {}.{} : {}",
                        methode.getDeclaringClass().getSimpleName(), methode.getName(), ex.toString());
                defaut.handleUncaughtException(ex, methode, params);
            }
        };
    }
}
