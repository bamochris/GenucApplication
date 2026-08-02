package cd.genuc.service;

import cd.genuc.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ClassementService {

    private final NoteRepository noteRepo;

    public List<Map<String, Object>> getClassementCours(Long coursId, String annee) {
        return noteRepo.getClassementCours(coursId, annee);
    }
}