# CONTRAT API ET FLUX - GENUC <-> TACHPAY

## 1. Objectif

Definir un contrat d'integration simple, progressif et robuste entre GENUC et TachPay pour executer le MVP du chapitre 19 sans dupliquer le coeur metier universitaire.

## 2. Principe d'architecture

GENUC est le systeme source du metier universitaire.

TachPay est le systeme transverse pour :

- paiement ;
- preuve numerique ;
- partage ;
- mobilite internationale ;
- ledger et rapprochement ;
- identite etudiante portable.

## 3. Objets d'integration prioritaires

Les quatre premiers objets d'integration sont :

1. `University`
2. `Student`
3. `AcademicFee`
4. `Diploma`

## 4. Mapping source of truth

| Objet             | Systeme source | Systeme consommateur   | Remarque                                                |
| ----------------- | -------------- | ---------------------- | ------------------------------------------------------- |
| Universite        | GENUC          | TachPay                | TachPay consomme l'universite comme tenant education    |
| Etudiant          | GENUC          | TachPay                | Le matricule et l'inscription viennent de GENUC         |
| Frais academique  | GENUC          | TachPay                | TachPay ne decide pas de l'exigibilite academique       |
| Paiement          | TachPay        | GENUC                  | GENUC consomme le statut confirme et la preuve          |
| Diplome           | GENUC          | TachPay                | TachPay publie une forme portable et verifiable         |
| Passport etudiant | TachPay        | Etudiant / partenaires | Vue agregee a partir de donnees GENUC + preuves TachPay |

## 5. Identifiants minimums partages

Chaque objet integre doit exposer au minimum :

- `sourceSystem` ;
- `sourceId` ;
- `externalReference` quand applicable ;
- `universityId` ;
- `studentId` quand applicable ;
- `updatedAt` ;
- `status`.

Regle : GENUC garde ses identifiants metier natifs. TachPay ajoute ses propres identifiants techniques sans remplacer les references source.

## 6. API minimales cote GENUC

### 6.1 Universites

- `GET /api/integration/universites`
- `GET /api/integration/universites/{universiteId}`

Payload minimal :

```json
{
  "sourceSystem": "GENUC",
  "sourceId": "universite-123",
  "code": "UNIKIN",
  "name": "Universite de Kinshasa",
  "country": "CD",
  "status": "ACTIVE",
  "updatedAt": "2026-07-19T10:15:30Z"
}
```

### 6.2 Etudiants

- `GET /api/integration/etudiants`
- `GET /api/integration/etudiants/{etudiantId}`
- `GET /api/integration/etudiants/{etudiantId}/inscription-active`

Payload minimal :

```json
{
  "sourceSystem": "GENUC",
  "sourceId": "etudiant-456",
  "universityId": "universite-123",
  "matricule": "HECKIN202500001",
  "fullName": "Jean Kasongo",
  "email": "jean@example.com",
  "program": "Informatique",
  "level": "L1",
  "status": "ACTIVE",
  "updatedAt": "2026-07-19T10:15:30Z"
}
```

### 6.3 Frais academiques

- `GET /api/integration/frais`
- `GET /api/integration/frais/{fraisId}`
- `GET /api/integration/etudiants/{etudiantId}/frais-exigibles`

Payload minimal :

```json
{
  "sourceSystem": "GENUC",
  "sourceId": "frais-789",
  "universityId": "universite-123",
  "studentId": "etudiant-456",
  "label": "Minerval 2026",
  "amount": 250.0,
  "currency": "USD",
  "status": "DUE",
  "dueDate": "2026-09-15",
  "updatedAt": "2026-07-19T10:15:30Z"
}
```

### 6.4 Diplomes

- `GET /api/integration/diplomes`
- `GET /api/integration/diplomes/{diplomeId}`

Payload minimal :

```json
{
  "sourceSystem": "GENUC",
  "sourceId": "diplome-101",
  "universityId": "universite-123",
  "studentId": "etudiant-456",
  "diplomaCode": "DIP-2026-0001",
  "title": "Licence en Informatique",
  "issuedAt": "2026-07-10T08:00:00Z",
  "verificationUrl": "https://genuc.example/verifier/diplome/uuid",
  "status": "ISSUED"
}
```

## 7. API minimales cote TachPay

### 7.1 Creation d'intention de paiement education

- `POST /api/v1/education/payments/intents`

Requete minimale :

```json
{
  "sourceSystem": "GENUC",
  "feeSourceId": "frais-789",
  "universityId": "universite-123",
  "studentId": "etudiant-456",
  "amount": 250.0,
  "currency": "USD",
  "channel": "MOBILE_MONEY",
  "payerCountry": "CI"
}
```

Reponse minimale :

```json
{
  "paymentIntentId": "payint_001",
  "reference": "EDU-2026-000001",
  "status": "PENDING",
  "checkoutUrl": "https://tachpay.example/pay/EDU-2026-000001",
  "expiresAt": "2026-07-19T11:15:30Z"
}
```

### 7.2 Statut de paiement

- `GET /api/v1/education/payments/{reference}`

Reponse minimale :

```json
{
  "reference": "EDU-2026-000001",
  "status": "SUCCESS",
  "amount": 250.0,
  "currency": "USD",
  "proofUrl": "https://tachpay.example/proofs/EDU-2026-000001",
  "receiptUrl": "https://tachpay.example/receipts/EDU-2026-000001",
  "confirmedAt": "2026-07-19T10:45:00Z"
}
```

### 7.3 TachStudent Passport

- `GET /api/v1/education/students/{studentId}/passport`

Reponse minimale :

```json
{
  "studentId": "etudiant-456",
  "passportId": "tsp_001",
  "identity": {
    "fullName": "Jean Kasongo",
    "matricule": "HECKIN202500001"
  },
  "documents": [],
  "payments": [],
  "diplomas": [],
  "shareControls": {
    "enabled": true
  }
}
```

### 7.4 Publication TachDiploma

- `POST /api/v1/education/diplomas/publish`

Requete minimale :

```json
{
  "sourceSystem": "GENUC",
  "sourceId": "diplome-101",
  "studentId": "etudiant-456",
  "universityId": "universite-123",
  "title": "Licence en Informatique",
  "verificationUrl": "https://genuc.example/verifier/diplome/uuid"
}
```

## 8. Evenements metier minimaux

Le contrat peut debuter en REST pur, mais il gagne en robustesse avec des evenements asynchrones.

Evenements minimums :

- `admission.validated`
- `student.created`
- `academic_fee.assigned`
- `payment.confirmed`
- `diploma.issued`

Exemple :

```json
{
  "eventType": "payment.confirmed",
  "sourceSystem": "TACHPAY",
  "occurredAt": "2026-07-19T10:45:00Z",
  "universityId": "universite-123",
  "studentId": "etudiant-456",
  "reference": "EDU-2026-000001",
  "feeSourceId": "frais-789",
  "status": "SUCCESS"
}
```

## 9. Flux MVP prioritaires

### 9.1 Admission -> TachStudent ID

1. GENUC valide le dossier.
2. GENUC cree ou confirme l'etudiant et son inscription.
3. GENUC emet `admission.validated` ou expose l'etudiant via API.
4. TachPay cree le profil education et le TachStudent ID.
5. TachPay renvoie son identifiant technique, conserve en reference croisee.

### 9.2 Frais academique -> Paiement TachPay -> Confirmation GENUC

1. GENUC declare un frais exigible.
2. GENUC appelle `POST /api/v1/education/payments/intents`.
3. TachPay cree une intention et une reference de paiement.
4. L'etudiant paie via le canal disponible.
5. TachPay confirme apres webhook operateur.
6. TachPay expose le statut et emet `payment.confirmed`.
7. GENUC marque le frais comme confirme sur preuve reelle.

### 9.3 Deliberation ou diplome -> TachDiploma

1. GENUC cloture la deliberation ou emet le diplome.
2. GENUC publie le diplome source via API ou evenement `diploma.issued`.
3. TachPay cree l'objet portable de verification et de partage.
4. Le lien public de verification reste traçable vers la source GENUC.

### 9.4 Etudiant -> TachStudent Passport

1. TachPay agrege l'identite etudiante depuis GENUC.
2. TachPay agrege paiements, preuves, documents et diplomes relies.
3. TachPay expose une vue passport partageable.
4. L'etudiant controle les permissions de partage.

## 10. Regles de securite

- Authentification machine-to-machine entre GENUC et TachPay.
- Signature ou HMAC pour les callbacks sensibles.
- Idempotence obligatoire sur creation d'intention et confirmation de paiement.
- Journal d'audit sur toutes les transitions critiques.
- Separation claire entre URL publique de verification et API internes d'administration.

## 11. Ordre de livraison recommande

1. Sync universites et etudiants.
2. Intentions et confirmations de paiement education.
3. Publication TachDiploma.
4. TachStudent Passport.
5. Extensions scholarship, visa, career, alumni, marketplace.

## 12. Decision cle

La regle principale du chapitre 19 est la suivante :

GENUC decide du fait academique. TachPay decide du fait de paiement, de preuve portable et d'interoperabilite transverse.

Cette separation garantit une integration realiste, evolutive et compatible avec l'etat actuel des deux plateformes.
