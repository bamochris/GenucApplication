package cd.genuc.exception;

public class AttestationNotFoundException extends RuntimeException {
    private final Long attestationId;

    public AttestationNotFoundException(Long id) {
        super("Attestation non trouvée : id=" + id);
        this.attestationId = id;
    }

    public AttestationNotFoundException(String message) {
        super(message);
        this.attestationId = null;
    }

    public Long getAttestationId() {
        return attestationId;
    }
}