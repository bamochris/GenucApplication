package cd.genuc.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Value("${server.port:8081}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Environnement local"),
                        new Server()
                                .url("https://api.genuc.cd")
                                .description("Environnement de production")
                ))
                .info(new Info()
                        .title("GENUC Platform API")
                        .description("Plateforme Nationale de Gestion Universitaire — République Démocratique du Congo")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Support GENUC")
                                .email("support@genuc.cd")
                                .url("https://genuc.cd")
                        )
                )
                // Schéma de sécurité JWT — active le bouton "Authorize" dans Swagger UI
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Entrez le token JWT obtenu via POST /api/auth/login")
                        )
                )
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName));
    }
}
