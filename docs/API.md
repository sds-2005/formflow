# FormFlow — API Design

## 1. Base URL and Versioning

- **Internal (BFF → FastAPI):** `{BACKEND_URL}/api/v1`
- **External (Browser → Next.js):** `/api/proxy/...` → forwarded to FastAPI

All routes versioned under `/api/v1`. OpenAPI docs at `/api/v1/docs`.

## 2. Common Conventions

### Request/Response Format
- Content-Type: `application/json`
- All responses include `request_id` header for tracing

### Pagination
```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

Query params: `?page=1&page_size=20` (defaults: page=1, page_size=20, max page_size=100)

### Error Format (RFC 9457 Problem Details)
```json
{
  "type": "urn:formflow:error:not-found",
  "title": "Form not found",
  "status": 404,
  "detail": "No form exists with the given identifier.",
  "instance": "/api/v1/forms/abc-123",
  "error_code": "FORM_NOT_FOUND"
}
```

### Status Codes
| Code | Usage |
|---|---|
| 200 | Successful read/update |
| 201 | Successful creation |
| 204 | Successful deletion |
| 400 | Validation error |
| 401 | Missing/invalid session |
| 403 | Forbidden (wrong workspace) |
| 404 | Resource not found |
| 409 | Conflict (duplicate idempotency key, stale version) |
| 422 | Unprocessable entity (schema validation) |
| 429 | Rate limited |
| 500 | Internal server error |

## 3. Session Routes

### POST `/api/v1/sessions`
Create a demo workspace/session.

**Request:** `{}` (empty body)

**Response:** `201`
```json
{
  "creator_id": "uuid",
  "workspace_name": "Demo Creator",
  "expires_at": "2026-10-08T22:00:00Z"
}
```
Sets `HttpOnly`, `Secure`, `SameSite=Lax` cookie with opaque session token.

### GET `/api/v1/sessions/me`
Get current session info.

**Response:** `200`
```json
{
  "creator_id": "uuid",
  "workspace_name": "Demo Creator",
  "expires_at": "2026-10-08T22:00:00Z"
}
```

### DELETE `/api/v1/sessions/me`
Expire current session.

**Response:** `204`

## 4. Form Routes

All require valid creator session.

### GET `/api/v1/forms`
List forms in current workspace.

**Query params:** `?page=1&page_size=20&search=feedback`

**Response:** `200`
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Customer Feedback",
      "status": "published",
      "slug": "abc123xyz",
      "response_count": 42,
      "question_count": 8,
      "created_at": "2026-10-01T10:00:00Z",
      "updated_at": "2026-10-05T14:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20,
  "has_more": false
}
```

### POST `/api/v1/forms`
Create a new form.

**Request:**
```json
{
  "title": "My Form"  // optional, defaults to "Untitled form"
}
```

**Response:** `201`
```json
{
  "id": "uuid",
  "title": "My Form",
  "status": "draft",
  "slug": "abc123xyz",
  "created_at": "...",
  "updated_at": "..."
}
```

### GET `/api/v1/forms/:id`
Get form details with questions.

**Response:** `200`
```json
{
  "id": "uuid",
  "title": "Customer Feedback",
  "status": "published",
  "slug": "abc123xyz",
  "published_version_id": "uuid-or-null",
  "has_unpublished_changes": true,
  "questions": [
    {
      "id": "uuid",
      "type": "short_text",
      "title": "What's your name?",
      "description": null,
      "required": true,
      "position": 0,
      "settings": {},
      "options": []
    }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

### PATCH `/api/v1/forms/:id`
Update form title.

**Request:**
```json
{
  "title": "Updated Title"
}
```

**Response:** `200` (updated form)

### POST `/api/v1/forms/:id/duplicate`
Duplicate form.

**Response:** `201` (new form, draft status, no responses)

### DELETE `/api/v1/forms/:id`
Delete form and all related data.

**Response:** `204`

### POST `/api/v1/forms/:id/publish`
Publish current draft as live version.

**Request:** `{}` (empty)

**Response:** `200`
```json
{
  "id": "uuid",
  "status": "published",
  "slug": "abc123xyz",
  "published_version_id": "version-uuid",
  "version_number": 2
}
```

### POST `/api/v1/forms/:id/unpublish`
Unpublish form (preserves responses).

**Response:** `200`
```json
{
  "id": "uuid",
  "status": "draft",
  "published_version_id": null
}
```

## 5. Question Routes

All require valid creator session. Form ownership verified.

### POST `/api/v1/forms/:formId/questions`
Add a question.

**Request:**
```json
{
  "type": "multiple_choice",
  "title": "What's your role?",
  "description": "Select one option",
  "required": true,
  "settings": {},
  "options": [
    {"label": "Developer"},
    {"label": "Designer"}
  ]
}
```

**Response:** `201`
```json
{
  "id": "uuid",
  "type": "multiple_choice",
  "title": "What's your role?",
  "description": "Select one option",
  "required": true,
  "position": 3,
  "settings": {},
  "options": [
    {"id": "uuid", "label": "Developer", "position": 0},
    {"id": "uuid", "label": "Designer", "position": 1}
  ]
}
```

### PATCH `/api/v1/forms/:formId/questions/:id`
Update a question.

**Request:** (partial update — only provided fields change)
```json
{
  "title": "Updated title",
  "required": false,
  "options": [
    {"id": "existing-uuid", "label": "Updated label"},
    {"label": "New option"}
  ]
}
```

**Response:** `200` (updated question)

### DELETE `/api/v1/forms/:formId/questions/:id`
Delete a question. Remaining questions re-positioned.

**Response:** `204`

### POST `/api/v1/forms/:formId/questions/:id/duplicate`
Duplicate a question.

**Response:** `201` (new question inserted after original)

### PUT `/api/v1/forms/:formId/questions/reorder`
Reorder all questions. Transactional.

**Request:**
```json
{
  "question_ids": ["uuid-3", "uuid-1", "uuid-2"]
}
```

**Response:** `200`
```json
{
  "questions": [
    {"id": "uuid-3", "position": 0},
    {"id": "uuid-1", "position": 1},
    {"id": "uuid-2", "position": 2}
  ]
}
```

Validates: all question IDs belong to this form, no duplicates, no missing.

## 6. Public Routes

No authentication required.

### GET `/api/v1/public/forms/:slug`
Fetch published form for respondent.

**Response:** `200`
```json
{
  "form_id": "uuid",
  "title": "Customer Feedback",
  "version_id": "version-uuid",
  "questions": [
    {
      "id": "uuid",
      "type": "short_text",
      "title": "What's your name?",
      "description": null,
      "required": true,
      "position": 0,
      "settings": {},
      "options": []
    }
  ]
}
```

If unpublished or not found: `404` with "This form is not available"

### POST `/api/v1/public/forms/:slug/submit`
Submit a response.

**Request:**
```json
{
  "version_id": "version-uuid",
  "idempotency_key": "client-generated-uuid",
  "answers": [
    {
      "question_id": "uuid",
      "value": "John Doe"
    },
    {
      "question_id": "uuid",
      "value": 4
    },
    {
      "question_id": "uuid",
      "value": true
    },
    {
      "question_id": "uuid",
      "value": ["option-uuid-1"]
    }
  ]
}
```

**Validation:**
- Version ID matches current published version
- All required questions answered
- No unknown question IDs
- Answer types match question types
- Email format validated
- Number range validated
- Choice IDs exist in version snapshot

**Response:** `201`
```json
{
  "submission_id": "uuid",
  "submitted_at": "2026-10-07T15:00:00Z",
  "message": "Thank you for your response!"
}
```

**Idempotent:** Same idempotency_key → `200` with original submission_id

## 7. Results Routes

Require valid creator session. Form ownership verified.

### GET `/api/v1/forms/:id/results/summary`
Aggregate statistics.

**Response:** `200`
```json
{
  "form_id": "uuid",
  "total_submissions": 42,
  "questions": [
    {
      "question_id": "uuid",
      "title": "What's your role?",
      "type": "multiple_choice",
      "total_answers": 42,
      "summary": {
        "options": [
          {"option_id": "uuid", "label": "Developer", "count": 25, "percentage": 59.5},
          {"option_id": "uuid", "label": "Designer", "count": 17, "percentage": 40.5}
        ]
      }
    },
    {
      "question_id": "uuid",
      "title": "Years of experience",
      "type": "number",
      "total_answers": 38,
      "summary": {
        "average": 5.3,
        "min": 1,
        "max": 20,
        "count": 38
      }
    },
    {
      "question_id": "uuid",
      "title": "Your email",
      "type": "email",
      "total_answers": 42,
      "summary": {
        "recent_values": ["alice@example.com", "bob@example.com"],
        "total_count": 42
      }
    }
  ]
}
```

### GET `/api/v1/forms/:id/results/submissions`
Paginated submissions.

**Query params:** `?page=1&page_size=20`

**Response:** `200`
```json
{
  "items": [
    {
      "id": "uuid",
      "submitted_at": "2026-10-07T15:00:00Z",
      "answers_preview": {
        "question-uuid-1": "John Doe",
        "question-uuid-2": "4",
        "question-uuid-3": "Yes"
      }
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

### GET `/api/v1/forms/:id/results/submissions/:submissionId`
Full individual response.

**Response:** `200`
```json
{
  "id": "uuid",
  "submitted_at": "2026-10-07T15:00:00Z",
  "form_version_id": "version-uuid",
  "answers": [
    {
      "question_id": "uuid",
      "question_title": "What's your name?",
      "question_type": "short_text",
      "value": "John Doe",
      "selected_options": null
    },
    {
      "question_id": "uuid",
      "question_title": "Your role?",
      "question_type": "multiple_choice",
      "value": null,
      "selected_options": [
        {"option_id": "uuid", "label": "Developer"}
      ]
    }
  ]
}
```

## 8. Health Routes

No authentication.

### GET `/api/v1/health`
**Response:** `200`
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

### GET `/api/v1/health/ready`
Checks database connectivity.

**Response:** `200` if ready, `503` if not.

## 9. Rate Limiting

| Endpoint | Limit |
|---|---|
| POST `/sessions` | 10/min per IP |
| POST `/public/forms/:slug/submit` | 30/min per IP |
| All creator routes | 120/min per session |
| GET `/public/forms/:slug` | 60/min per IP |

Rate limit headers included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## 10. Request Size Limits

| Endpoint | Max Body |
|---|---|
| Form mutations | 64 KB |
| Question mutations | 64 KB |
| Submission | 256 KB |
| All others | 16 KB |
