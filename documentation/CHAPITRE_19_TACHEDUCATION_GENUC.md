# Chapitre 19 - TachEducation & GENUC

## Lecture correcte du chapitre 19

Le chapitre 19 ne demande pas de reconstruire tout le domaine universitaire dans TachPay.

La lecture la plus solide est la suivante :

- GENUC porte deja le systeme d'exploitation universitaire.
- TachPay apporte l'infrastructure de paiement, d'identite, de verification, de mobilite et d'ecosysteme.
- Le vrai chantier est donc l'integration GENUC <-> TachPay.

En consequence, la suite du chapitre 19 doit etre pilotee comme un programme d'integration, pas comme un simple ajout de quelques entites education dans TachPay.

## Ce que dit le Blueprint

Le chapitre 19 definit 5 blocs.

1. Le noyau universitaire
   Admissions, etudiants, enseignants, deliberations, diplomes, documents, finance universitaire.
2. L'identite etudiante numerique
   TachStudent Passport, partage controle, preuves academiques et administratives.
3. La finance et la mobilite internationale
   Paiement international, conversion, preuve numerique, dossier de mobilite education.
4. L'ecosysteme et l'employabilite
   Bourses, carriere, alumni, entreprises, marketplace campus.
5. La couche intelligence et plateforme
   IA universitaire, analytics, securite, universite comme plateforme.

## Etat reel de GENUC

GENUC couvre deja une large partie du noyau universitaire.

### Deja present

- Admissions publiques avec dossier, suivi, validation et generation du matricule.
- Paiement des frais de dossier avec webhook de confirmation et suivi d'etat.
- Paiement academique de reference via TachPay/TachFee.
- Gestion etudiant, inscription, promotion, annee academique et multi-tenance par universite.
- Cours, notes, validation, publication, deliberations, rattrapage, jury et PV.
- Attestations, carte etudiante, diplomes et verification publique par QR/route frontend/API publique.
- Frontend multi-portails : etudiant, professeur, admin, finances.

### Implication

GENUC est deja le socle metier du chapitre 19 pour tout ce qui concerne l'operation universitaire quotidienne.

## Etat reel de TachPay

TachPay est deja avance sur plusieurs chapitres hors education.

### Deja present

- Paiements, wallets, ledger, webhooks, verification documentaire.
- Developer platform, IA, global FX, marketplace, reporting, compliance.
- Fondations education en persistance : University, Student, AcademicFee, Diploma et leurs repositories.

### Manque pour le chapitre 19

- Aucun EducationController, UniversityController, StudentController ou surface REST education dediee.
- Aucune couche service education visible pour orchestrer les cas d'usage universitaires.
- Aucun flux d'integration explicite entre admission GENUC, frais universitaires GENUC et modules TachPay education.
- Aucun test d'integration de bout en bout sur les scenarios education du chapitre 19.

### Implication

Dans TachPay, le chapitre 19 est encore au stade de fondation de modele, pas au stade de produit integre.

## Matrice d'ecart

| Bloc chapitre 19                    | Present dans GENUC                        | Present dans TachPay                                      | Ecart reel                                                  | Priorite |
| ----------------------------------- | ----------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| Admissions                          | Oui, tres avance                          | Non, pas de surface education                             | Integrer TachPay au flux d'admission GENUC                  | Haute    |
| Etudiant / identite academique      | Oui, via etudiant, inscription, matricule | Partiel, entite Student uniquement                        | Construire TachStudent ID/Passport autour des donnees GENUC | Haute    |
| Finance universitaire               | Oui, deja riche                           | Partiel, AcademicFee + paiements generiques               | Brancher AcademicFee/ledger/proof sur les flux GENUC        | Haute    |
| Comptabilite / rapprochement        | Oui cote frais et encaissement            | Oui cote ledger, reporting et webhook                     | Relier les deux modeles et normaliser les preuves           | Haute    |
| Enseignants / notes / deliberations | Oui                                       | Non visible cote education                                | Consommer les sorties GENUC plutot que les reimplementer    | Moyenne  |
| Diplomes numeriques                 | Oui, verification publique deja presente  | Partiel, entite Diploma + preuves/verification generiques | Publier un TachDiploma alimente par GENUC                   | Haute    |
| TachStudent Passport                | Partiel, documents officiels disperses    | Non                                                       | Agreger documents, paiements, parcours et partage           | Haute    |
| Paiement etudiant international     | Non natif a ce niveau                     | Oui, FX/global deja en place                              | Connecter paiement admission/frais GENUC a Global/FX        | Haute    |
| TachVisa Education                  | Partiel, documents et preuves existent    | Partiel, verify/proof existent                            | Composer un dossier numerique education exportable          | Moyenne  |
| TachScholarship                     | Non structure comme plateforme complete   | Non visible                                               | Nouveau module produit                                      | Moyenne  |
| TachCareer                          | Partiel, donnees acad. existent           | Non visible                                               | Nouveau module produit                                      | Basse    |
| TachAlumni Network                  | Partiel, role alumni existe cote front    | Non visible                                               | Nouveau module produit                                      | Basse    |
| IA universitaire                    | Partiel, analytics et chatbot local       | Oui, TachAI existe                                        | Specialiser TachAI sur les donnees GENUC                    | Moyenne  |
| Universite comme plateforme         | Oui, deja proche                          | Partiel                                                   | Formaliser l'integration comme offre multi-tenant           | Moyenne  |
| TachCampus Marketplace              | Non specialise                            | Oui, marketplace generique existe                         | Adapter le marketplace au contexte campus                   | Basse    |
| Integration entreprises             | Partiel                                   | Partiel                                                   | Connecter bourses, stages, recrutement et sponsoring        | Moyenne  |

## Decision architecturale recommandee

Le plus robuste est de garder cette repartition des responsabilites.

### GENUC reste systeme source pour

- admissions
- etudiants et inscriptions
- structure academique
- notes et deliberations
- diplomes et documents officiels
- role-based portals universitaires

### TachPay devient systeme transverse pour

- paiements et recouvrements
- ledger et rapprochement
- verification, preuves et partage
- paiements internationaux et FX
- identite etudiante portable
- API partenaires, entreprises et services premium
- IA transverse et analytics inter-universites

Cette separation evite de dupliquer le metier universitaire dans TachPay, tout en laissant TachPay porter la couche plateforme panafricaine du chapitre 19.

## MVP recommande pour continuer le chapitre 19

Le MVP doit rester court et executable.

### Lot 1 - Education Core Bridge

Objectif : rendre l'integration GENUC <-> TachPay reelle sur 4 objets.

- University sync
- Student sync
- AcademicFee sync
- Diploma publication sync

Resultat attendu : TachPay sait recevoir ou recuperer depuis GENUC les universites, etudiants, frais et diplomes utiles a ses propres services.

### Lot 2 - Finance universitaire integree

Objectif : faire du chapitre 19 un vrai cas d'usage financier.

- creation d'une reference de paiement pour un frais GENUC
- paiement local ou international via TachPay
- webhook/confirmation
- preuve numerique exploitable par GENUC
- alimentation du ledger et des rapports

Resultat attendu : un etudiant peut payer un frais universitaire et le statut est confirme proprement entre les deux systemes.

### Lot 3 - TachStudent Passport

Objectif : creer la premiere vraie innovation visible du chapitre 19.

- profil etudiant portable
- historique paiements
- documents officiels relies
- diplomes et attestations lies
- partage controle par l'etudiant

Resultat attendu : un etudiant peut exposer une vue portable et verifiable de son parcours.

### Lot 4 - Mobilite education

Objectif : utiliser les briques deja existantes de TachPay Global et Verify.

- paiement international d'admission ou de frais
- preuve financiere verifiable
- dossier numerique de mobilite
- piece exportable pour TachVisa Education

Resultat attendu : le chapitre 19 commence a produire sa promesse internationale.

## Contrat technique cible entre GENUC et TachPay

Le contrat le plus simple pour commencer est hybride : API REST + evenements metier.

### API minimales cote GENUC

- expose universites, etudiants, frais, diplomes et statuts de paiement
- fournit les identifiants metier sources
- publie des routes publiques de verification deja existantes

### API minimales cote TachPay

- cree une intention de paiement education
- retourne reference, statut, preuve et recu
- expose un profil TachStudent Passport agrege
- publie un objet Diploma verifiable cote TachPay si necessaire

### Evenements metier minimaux

- admission.validated
- student.created
- academic_fee.assigned
- payment.confirmed
- diploma.issued

## Ordre d'implementation conseille

1. Ne pas commencer par scholarship, alumni ou marketplace.
2. Commencer par le pont finance + etudiant + diplome.
3. Reutiliser au maximum les flux deja fiables de GENUC.
4. Reutiliser au maximum les briques deja testees de TachPay : ledger, webhook, FX, verify, share, AI.
5. N'ajouter les modules ecosysteme qu'apres stabilisation du socle education-core.

## Formulation concise de la suite du chapitre 19

La suite logique du chapitre 19 est la suivante :

GENUC opere l'universite. TachPay connecte l'universite au paiement, a la preuve numerique, a la mobilite internationale et a l'ecosysteme de services. Le produit a construire n'est donc pas un second logiciel academique dans TachPay, mais une infrastructure d'integration capable d'unifier admission, paiement, diplome, verification, identite et employabilite sur une meme colonne vertebrale numerique.

## Prochaine etape recommandee

La prochaine etape concrete devrait etre un document d'API et de flux pour ces 4 parcours MVP :

1. admission -> creation TachStudent
2. frais academique -> paiement TachPay -> confirmation GENUC
3. deliberation/diplome GENUC -> TachDiploma verifiable
4. etudiant -> TachStudent Passport partageable
