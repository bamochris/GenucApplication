# 📖 GENUC - API Endpoints Documentation

## 🔐 Authentication Endpoints

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "code": "SUCCESS",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "1",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ETUDIANT"
    }
  }
}
```

### 2. Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "ETUDIANT"
}

Response (201):
{
  "code": "SUCCESS",
  "message": "Registration successful",
  "data": {
    "id": "2",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "ETUDIANT"
  }
}
```

### 3. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response (200):
{
  "code": "SUCCESS",
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 4. Logout
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}

Response (200):
{
  "code": "SUCCESS",
  "message": "Logout successful"
}
```

### 5. Get Profile
```http
GET /api/auth/profile
Authorization: Bearer {accessToken}

Response (200):
{
  "code": "SUCCESS",
  "message": "Profile retrieved",
  "data": {
    "id": "1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ETUDIANT",
    "universite": "Université de Kinshasa",
    "filiere": "Informatique",
    "promotion": "L3-2024"
  }
}
```

---

## 👥 User Endpoints

### Get User by ID
```http
GET /api/users/{id}
Authorization: Bearer {accessToken}

Response (200):
{
  "code": "SUCCESS",
  "data": {
    "id": "1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ETUDIANT",
    "status": "ACTIVE"
  }
}
```

### Update User
```http
PUT /api/users/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+243123456789"
}

Response (200):
{
  "code": "SUCCESS",
  "message": "User updated successfully",
  "data": {
    "id": "1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+243123456789"
  }
}
```

### List Users (ADMIN Only)
```http
GET /api/users?page=0&size=10&role=ETUDIANT
Authorization: Bearer {adminToken}

Response (200):
{
  "code": "SUCCESS",
  "data": {
    "content": [
      {"id": "1", "email": "user1@example.com", "role": "ETUDIANT"},
      {"id": "2", "email": "user2@example.com", "role": "ETUDIANT"}
    ],
    "totalElements": 150,
    "totalPages": 15,
    "currentPage": 0
  }
}
```

---

## 🎓 Courses Endpoints

### Get Courses
```http
GET /api/cours
Authorization: Bearer {accessToken}

Response (200):
{
  "code": "SUCCESS",
  "data": [
    {
      "id": "1",
      "code": "INF101",
      "title": "Introduction à l'Informatique",
      "credits": 3,
      "professor": "Dr. Jean Dupont",
      "promotion": "L1-2024"
    }
  ]
}
```

### Get My Courses (Student)
```http
GET /api/cours/etudiant/{studentId}
Authorization: Bearer {studentToken}

Response (200):
{
  "code": "SUCCESS",
  "data": [
    {
      "id": "1",
      "code": "INF101",
      "title": "Introduction à l'Informatique",
      "credits": 3,
      "professor": "Dr. Jean Dupont",
      "schedule": "Monday 8:00-10:00"
    }
  ]
}
```

### Get Professor Courses
```http
GET /api/cours/professeur/{profId}
Authorization: Bearer {professorToken}

Response (200):
{
  "code": "SUCCESS",
  "data": [
    {
      "id": "1",
      "code": "INF101",
      "title": "Introduction à l'Informatique",
      "students": 45,
      "promotion": "L1-2024"
    }
  ]
}
```

---

## 📝 Notes Endpoints

### Get Notes
```http
GET /api/notes?coursId={coursId}&studentId={studentId}
Authorization: Bearer {accessToken}

Response (200):
{
  "code": "SUCCESS",
  "data": {
    "coursId": "1",
    "studentId": "5",
    "examScore": 15.5,
    "assignmentScore": 18,
    "projectScore": 17,
    "finalScore": 16.83
  }
}
```

### Create/Update Notes (Professor)
```http
POST /api/notes
Authorization: Bearer {professorToken}
Content-Type: application/json

{
  "coursId": "1",
  "studentId": "5",
  "examScore": 15.5,
  "assignmentScore": 18,
  "projectScore": 17,
  "evaluationType": "FINAL"
}

Response (201):
{
  "code": "SUCCESS",
  "message": "Note created successfully",
  "data": {
    "id": "123",
    "coursId": "1",
    "studentId": "5",
    "finalScore": 16.83
  }
}
```

---

## 💰 Payment Endpoints

### Get Student Payments
```http
GET /api/paiements/etudiant/{studentId}
Authorization: Bearer {studentToken}

Response (200):
{
  "code": "SUCCESS",
  "data": [
    {
      "id": "1",
      "amount": 500000,
      "type": "SCOLARITE",
      "date": "2026-06-25T10:30:00Z",
      "status": "SUCCESS",
      "reference": "PAY-2026-001"
    }
  ]
}
```

### Create Payment
```http
POST /api/paiements
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "studentId": "5",
  "amount": 500000,
  "type": "SCOLARITE",
  "paymentMethod": "MOBILE_MONEY",
  "reference": "MTN-12345"
}

Response (201):
{
  "code": "SUCCESS",
  "message": "Payment created successfully",
  "data": {
    "id": "2",
    "amount": 500000,
    "status": "PENDING",
    "reference": "PAY-2026-002"
  }
}
```

### Get Payment Receipt
```http
GET /api/paiements/{paymentId}/receipt
Authorization: Bearer {accessToken}

Response (200):
{
  "code": "SUCCESS",
  "data": {
    "receipt_number": "RCP-2026-001",
    "student_name": "John Doe",
    "amount": 500000,
    "date": "2026-06-25T10:30:00Z",
    "method": "MOBILE_MONEY",
    "reference": "MTN-12345"
  }
}
```

---

## 📊 Reports Endpoints

### Financial Reports
```http
GET /api/rapports/financiers?year=2026&month=6
Authorization: Bearer {adminToken}

Response (200):
{
  "code": "SUCCESS",
  "data": {
    "total_collected": 5000000,
    "total_expected": 8000000,
    "recovery_rate": 62.5,
    "by_faculty": [
      {"faculty": "Science", "amount": 2000000},
      {"faculty": "Engineering", "amount": 3000000}
    ]
  }
}
```

### Academic Reports
```http
GET /api/rapports/academiques?type=attendance&courseId={courseId}
Authorization: Bearer {professorToken}

Response (200):
{
  "code": "SUCCESS",
  "data": {
    "course": "INF101",
    "total_sessions": 20,
    "students": [
      {
        "id": "5",
        "name": "John Doe",
        "attendance_rate": 85.5
      }
    ]
  }
}
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must be at least 6 characters"
  },
  "timestamp": "2026-06-25T12:00:00Z"
}
```

### 401 Unauthorized
```json
{
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired token",
  "timestamp": "2026-06-25T12:00:00Z"
}
```

### 403 Forbidden
```json
{
  "code": "FORBIDDEN",
  "message": "You don't have permission to access this resource",
  "timestamp": "2026-06-25T12:00:00Z"
}
```

### 500 Internal Server Error
```json
{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred",
  "timestamp": "2026-06-25T12:00:00Z"
}
```
