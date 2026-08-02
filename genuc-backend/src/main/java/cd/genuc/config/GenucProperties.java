package cd.genuc.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "genuc")
public class GenucProperties {
    private Map<String, String> testAccounts;
}