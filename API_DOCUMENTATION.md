# Vision Exam Platform - API Documentation

## Overview
This document provides API documentation for the Vision Exam Platform (ProctoShield), a secure online examination system with real-time proctoring features.

## Base URLs
- **Backend API**: `http://localhost:5001/api`
- **Frontend**: `http://localhost:5173`
- **WebSocket**: `ws://localhost:5001`

## Authentication

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"  // student, mentor, or admin
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response includes JWT token:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## Exam Management

### Create Exam (Admin/Mentor only)
```http
POST /api/exams
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "JavaScript Fundamentals",
  "description": "Test your JavaScript knowledge",
  "durationMinutes": 60,
  "questions": [...]
}
```

### Get Exams
```http
GET /api/exams
Authorization: Bearer <token>
```

### Start Exam Session
```http
POST /api/exams/:examId/start
Authorization: Bearer <token>
```

### Submit Exam
```http
POST /api/exams/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "examId": "exam_id",
  "answers": {...}
}
```

## Real-time WebSocket Events

### Connection
Connect with JWT token:
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:5001', {
  auth: { token: 'your_jwt_token' }
});
```

### Events Emitted by Client

#### Report Violation (Student)
```javascript
socket.emit('student_violation', {
  examId: 'exam_id',
  type: 'Tab Switch',
  severity: 'medium',
  details: 'User switched tabs 3 times'
});
```

#### Request Help (Student)
```javascript
socket.emit('student_need_help', {
  examId: 'exam_id',
  questionId: 'question_1',
  message: 'Need clarification on question 5'
});
```

#### Broadcast Message (Mentor/Admin)
```javascript
socket.emit('mentor_broadcast', {
  examId: 'exam_id',
  message: '10 minutes remaining'
});
```

### Events Received by Client

#### Exam Broadcast (Student)
```javascript
socket.on('exam_broadcast', (data) => {
  console.log('Broadcast:', data.message);
});
```

#### Student Help Request (Mentor/Admin)
```javascript
socket.on('student_need_help', (data) => {
  console.log('Student needs help:', data.studentEmail, data.message);
});
```

#### Mentor Alert (Mentor/Admin)
```javascript
socket.on('mentor_alert', (data) => {
  console.log('Violation alert:', data.studentEmail, data.type);
});
```

## Error Handling

### Common Error Responses
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Authentication Error Codes
- `TOKEN_EXPIRED` - JWT token has expired
- `INVALID_TOKEN` - Malformed or invalid token
- `SESSION_TERMINATED` - User logged in from another device

## Frontend Service Methods

The frontend includes a comprehensive API service (`src/services/api.js`) with methods for:

### Authentication
- `login(email, password)`
- `register(userData)`
- `logout()`

### Exam Operations
- `getExams()`
- `createExam(examData)`
- `startExam(examId)`
- `submitExam(examId, answers)`
- `runCodingQuestion(examId, questionId, sourceCode, language)`

### User Management (Admin)
- `getStudents()`
- `getMentors()`
- `getAdmins()`
- `addUser(userData)`

### Dashboard
- `getDashboardStats()`
- `getSystemHealth()`

## Environment Variables

### Backend (.env)
```
PORT=5001
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
REDIS_URL=your_redis_url
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

## Testing

### Backend Tests
```bash
cd backend
npm test          # Run tests
npm run test:coverage  # Run tests with coverage
```

### Frontend Tests
```bash
cd frontend
npm test          # Run tests
npm run test:coverage  # Run tests with coverage
```

## Security Features

1. **JWT Authentication** - Token-based authentication with role-based access control
2. **Rate Limiting** - 100 requests/15min (global), 10 requests/15min (auth endpoints)
3. **CORS Protection** - Only allowed origins can access the API
4. **Session Management** - Single session per user (new login invalidates old tokens)
5. **Input Validation** - All user inputs are validated
6. **HTTPS/SSL** - Recommended for production

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `FRONTEND_URL` in .env matches your frontend origin
2. **MongoDB Connection**: Verify `MONGODB_URI` is correct and MongoDB is running
3. **Redis Connection**: Check `REDIS_URL` if using Redis for caching
4. **JWT Errors**: Verify `JWT_SECRET` is set and consistent

### Logs
Check the backend console output for:
- Server startup messages
- Database connection status
- WebSocket connections
- Authentication logs
- Error details