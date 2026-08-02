package cd.genuc.exception;

public class ResourceNotFoundException extends RuntimeException {
    private final String resourceType;
    private final Long resourceId;

    public ResourceNotFoundException(String resourceType, Long id) {
        super(resourceType + " non trouvé : id=" + id);
        this.resourceType = resourceType;
        this.resourceId = id;
    }

    public String getResourceType() {
        return resourceType;
    }

    public Long getResourceId() {
        return resourceId;
    }
}
