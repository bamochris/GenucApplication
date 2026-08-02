package cd.genuc.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemeService {

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/genuc_db}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:genuc_user}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    private final String BACKUP_DIR = "backups/";

    /**
     * Effectue un backup de la base de données en utilisant pg_dump.
     * @return le contenu du fichier SQL en bytes
     * @throws Exception si erreur lors de l'exécution
     */
    public byte[] effectuerBackup() throws Exception {
        // Créer un répertoire de backup si inexistant
        File backupDir = new File(BACKUP_DIR);
        if (!backupDir.exists()) {
            backupDir.mkdirs();
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = BACKUP_DIR + "backup_genuc_" + timestamp + ".sql";

        // Construire la commande pg_dump
        String[] command = buildPgDumpCommand(filename);

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.environment().put("PGPASSWORD", password);
        pb.redirectErrorStream(true);

        Process process = pb.start();
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            // Lire la sortie d'erreur
            StringBuilder error = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    error.append(line).append("\n");
                }
            }
            throw new Exception("Backup échoué avec le code : " + exitCode + " - " + error);
        }

        // Lire le fichier généré
        File backupFile = new File(filename);
        byte[] data = new byte[(int) backupFile.length()];
        try (FileInputStream fis = new FileInputStream(backupFile)) {
            fis.read(data);
        }

        // Optionnel : supprimer le fichier après l'avoir lu ? On peut le garder.
        return data;
    }

    /**
     * Restaure la base de données à partir d'un flux d'entrée.
     * @param inputStream flux contenant le script SQL
     * @param filename nom du fichier (pour log)
     * @throws Exception si erreur lors de l'exécution de psql
     */
    public void effectuerRestauration(InputStream inputStream, String filename) throws Exception {
        File tempFile = null;
        try {
            // Créer un fichier temporaire pour le script SQL
            tempFile = File.createTempFile("restore_", ".sql");
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                // Copier le flux entrant vers le fichier temporaire
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    fos.write(buffer, 0, bytesRead);
                }
                fos.flush();
            }
            log.info("Fichier de restauration temporaire créé : {} (taille: {} octets)", 
                     tempFile.getAbsolutePath(), tempFile.length());

            // Construire la commande psql
            String[] command = buildPsqlCommand(tempFile.getAbsolutePath());
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.environment().put("PGPASSWORD", password);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Lire la sortie pour log
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("Restauration échouée : code sortie {}, sortie : {}", exitCode, output);
                throw new Exception("Erreur lors de la restauration. Code : " + exitCode + " - Détails : " + output);
            }
            log.info("Restauration réussie. Sortie : {}", output);
        } finally {
            // Fermer le flux d'entrée (le caller est responsable)
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (IOException e) {
                    log.warn("Erreur lors de la fermeture du flux d'entrée", e);
                }
            }
            // Supprimer le fichier temporaire
            if (tempFile != null && tempFile.exists()) {
                boolean deleted = tempFile.delete();
                if (!deleted) {
                    log.warn("Impossible de supprimer le fichier temporaire : {}", tempFile.getAbsolutePath());
                }
            }
        }
    }

    // ─── Méthodes utilitaires de construction de commandes ───────────

    /**
     * Construit la commande pg_dump avec les paramètres de connexion.
     */
    private String[] buildPgDumpCommand(String outputFilePath) {
        DbConnectionParams params = parseJdbcUrl();
        return new String[]{
                "pg_dump",
                "-h", params.host,
                "-p", params.port,
                "-U", params.username,
                "-d", params.database,
                "-f", outputFilePath,
                "--format=p",   // format texte (SQL)
                "--clean",      // inclure DROP statements
                "--if-exists",  // utiliser IF EXISTS
                "--no-owner",   // éviter les problèmes d'owner
                "--no-privileges"
        };
    }

    /**
     * Construit la commande psql pour la restauration.
     */
    private String[] buildPsqlCommand(String sqlFilePath) {
        DbConnectionParams params = parseJdbcUrl();
        return new String[]{
                "psql",
                "-h", params.host,
                "-p", params.port,
                "-U", params.username,
                "-d", params.database,
                "-f", sqlFilePath,
                "--set", "ON_ERROR_STOP=on"
        };
    }

    /**
     * Parse l'URL JDBC PostgreSQL pour extraire hôte, port, base de données.
     */
    private DbConnectionParams parseJdbcUrl() {
        String host = "localhost";
        String port = "5432";
        String database = "genuc_db";

        if (datasourceUrl != null && datasourceUrl.startsWith("jdbc:postgresql://")) {
            String withoutPrefix = datasourceUrl.substring("jdbc:postgresql://".length());
            // séparer l'hôte:port et la base
            String[] parts = withoutPrefix.split("/", 2);
            if (parts.length >= 2) {
                String hostPort = parts[0];
                String[] hostPortParts = hostPort.split(":");
                if (hostPortParts.length == 2) {
                    host = hostPortParts[0];
                    port = hostPortParts[1];
                } else {
                    host = hostPortParts[0];
                    // port par défaut
                }
                database = parts[1];
            }
        }
        return new DbConnectionParams(host, port, database, username);
    }

    // ─── Classe interne pour les paramètres ──────────────────────────
    private static class DbConnectionParams {
        final String host;
        final String port;
        final String database;
        final String username;

        DbConnectionParams(String host, String port, String database, String username) {
            this.host = host;
            this.port = port;
            this.database = database;
            this.username = username;
        }
    }
}