-- V16 — Colonnes booléennes adossées à un primitif Java : interdire NULL.
--
-- Constaté le 02/08/2026 en créant le premier super-admin par insertion SQL :
-- la connexion échouait en 401 « Email ou mot de passe incorrect » alors que le
-- mot de passe était juste. Cause réelle : two_factor_enabled valait NULL, et
-- l'entité déclare « private boolean twoFactorEnabled » — un primitif. Hibernate
-- échoue à l'hydratation, et AuthService.connecter attrape l'exception dans un
-- catch générique qui la convertit en identifiants invalides. Le vrai motif
-- n'apparaît qu'en niveau DEBUG.
--
-- Le défaut ne se voyait pas jusqu'ici parce que toutes les lignes passaient par
-- JPA, qui écrit la valeur du champ. Il se déclenche dès qu'une ligne est créée
-- autrement : script de reprise, import, amorçage manuel — précisément les cas
-- où l'on a le moins envie d'un diagnostic trompeur.
--
-- Deux colonnes sont concernées dans tout le schéma (recherche croisée entre les
-- primitifs des entités et les colonnes nullable de V1).

UPDATE utilisateurs   SET two_factor_enabled = false WHERE two_factor_enabled IS NULL;
UPDATE refresh_tokens SET revoque            = false WHERE revoque            IS NULL;

ALTER TABLE utilisateurs
    ALTER COLUMN two_factor_enabled SET DEFAULT false,
    ALTER COLUMN two_factor_enabled SET NOT NULL;

ALTER TABLE refresh_tokens
    ALTER COLUMN revoque SET DEFAULT false,
    ALTER COLUMN revoque SET NOT NULL;
