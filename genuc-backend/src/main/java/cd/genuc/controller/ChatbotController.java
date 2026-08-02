package cd.genuc.controller;

import cd.genuc.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/question")
    public ResponseEntity<?> repondre(@RequestBody Map<String, Object> body) {
        String question = (String) body.get("question");
        String role = (String) body.getOrDefault("role", "ETUDIANT");
        Long userId = body.get("userId") != null ? Long.valueOf(body.get("userId").toString()) : null;
        @SuppressWarnings("unchecked")
        List<Map<String, String>> historique = (List<Map<String, String>>) body.getOrDefault("historique", List.of());

        String reponse = chatbotService.traiterQuestion(question, role, userId, historique);
        return ResponseEntity.ok(Map.of("reponse", reponse, "status", "ok"));
    }
}
