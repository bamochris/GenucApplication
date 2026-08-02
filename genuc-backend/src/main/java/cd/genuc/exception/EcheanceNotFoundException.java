package cd.genuc.exception;

public class EcheanceNotFoundException extends RuntimeException {
    private final Long echeanceId;

    public EcheanceNotFoundException(Long id) {
        super("Échéance non trouvée : id=" + id);
        this.echeanceId = id;
    }

    public Long getEcheanceId() {
        return echeanceId;
    }
}
