// src/test/java/cd/genuc/security/SecurityConfigTest.java
package cd.genuc.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import cd.genuc.IntegrationTestBase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testPublicEndpoint_ShouldBeAccessible() throws Exception {
        mockMvc.perform(get("/api/universites/public"))
                .andExpect(status().isOk());
    }

    @Test
    void testProtectedEndpoint_WithoutToken_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/universites"))
                .andExpect(status().isUnauthorized());
    }
}