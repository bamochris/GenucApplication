package cd.genuc.exception;

public class EcheancierNotFoundException extends RuntimeException {
    private final Long echeancierId;

    public EcheancierNotFoundException(Long id) {
        super("Échéancier non trouvé : id=" + id);
        this.echeancierId = id;
    }

    public Long getEcheancierId() {
        return echeancierId;
    }
}
