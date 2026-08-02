package cd.genuc.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;

/**
 * Payment Provider Configuration
 * Configure RestTemplate for calling payment provider APIs
 */
@Configuration
public class PaymentProviderConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        // setConnectTimeout/setReadTimeout sont dépréciés et marqués pour suppression
        // depuis Spring Boot 3.4 au profit de connectTimeout/readTimeout.
        return builder
                .connectTimeout(java.time.Duration.ofSeconds(10))
                .readTimeout(java.time.Duration.ofSeconds(30))
                .build();
    }
}
