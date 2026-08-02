package cd.genuc.config;

import cd.genuc.dto.kafka.NotificationEvent;
import cd.genuc.dto.kafka.PaiementWebhookEvent;
import cd.genuc.dto.kafka.PdfGenerationEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
@EnableKafka
@ConditionalOnProperty(name = "genuc.kafka.enabled", havingValue = "true")
public class KafkaConfig {

    // ─── Topics ────────────────────────────────────────────────────────
    public static final String TOPIC_NOTIFICATIONS     = "genuc.notifications";
    public static final String TOPIC_WEBHOOKS          = "genuc.paiements.webhooks";
    public static final String TOPIC_DLQ_NOTIFICATIONS = "genuc.notifications.dlq";
    public static final String TOPIC_PDF_GENERATION    = "genuc.pdf.generation";
    public static final String TOPIC_DLQ_PDF           = "genuc.pdf.generation.dlq";

    @Bean
    public NewTopic topicNotifications() {
        return TopicBuilder.name(TOPIC_NOTIFICATIONS)
                .partitions(6)       // 6 partitions = 6 consumers en parallèle max
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic topicWebhooks() {
        return TopicBuilder.name(TOPIC_WEBHOOKS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic topicDlq() {
        return TopicBuilder.name(TOPIC_DLQ_NOTIFICATIONS)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic topicPdfGeneration() {
        return TopicBuilder.name(TOPIC_PDF_GENERATION)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic topicDlqPdf() {
        return TopicBuilder.name(TOPIC_DLQ_PDF)
                .partitions(1)
                .replicas(1)
                .build();
    }

    // ─── Consumer factory avec gestion d'erreurs ───────────────────────
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, NotificationEvent>
    notificationListenerFactory(
            ConsumerFactory<String, NotificationEvent> cf,
            KafkaTemplate<String, NotificationEvent> template) {

        var factory = new ConcurrentKafkaListenerContainerFactory<String, NotificationEvent>();
        factory.setConsumerFactory(cf);
        factory.setConcurrency(10);  // 10 threads consommateurs pour les notifications
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.RECORD);

        // Retry 3 fois avec 2s d'intervalle, puis envoie en DLQ
        var recoverer = new DeadLetterPublishingRecoverer(template);
        var errorHandler = new DefaultErrorHandler(recoverer, new FixedBackOff(2000L, 3));
        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaiementWebhookEvent>
    webhookListenerFactory(ConsumerFactory<String, PaiementWebhookEvent> cf) {

        var factory = new ConcurrentKafkaListenerContainerFactory<String, PaiementWebhookEvent>();
        factory.setConsumerFactory(cf);
        factory.setConcurrency(3);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.RECORD);

        var errorHandler = new DefaultErrorHandler(new FixedBackOff(5000L, 5));
        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PdfGenerationEvent>
    pdfListenerFactory(ConsumerFactory<String, PdfGenerationEvent> cf,
                       KafkaTemplate<String, PdfGenerationEvent> template) {

        var factory = new ConcurrentKafkaListenerContainerFactory<String, PdfGenerationEvent>();
        factory.setConsumerFactory(cf);
        factory.setConcurrency(3);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.RECORD);

        var recoverer = new DeadLetterPublishingRecoverer(template);
        var errorHandler = new DefaultErrorHandler(recoverer, new FixedBackOff(3000L, 3));
        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }
}
