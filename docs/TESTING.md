# FormFlow — Testing Strategy

## 1. Overview

Testing is continuous — every milestone includes tests for the features built. Tests verify real behavior, not implementation details.

## 2. Backend Testing

### Framework
- **Pytest** with async support
- **HTTPX** for API integration tests
- **Factory Boy** or fixtures for test data
- **In-memory SQLite** for test isolation (fresh DB per test)

### Coverage Areas

#### Model & Constraint Tests
- All check constraints enforced (status values, type values, lengths)
- Foreign key constraints
- Unique constraints (slug, idempotency key, positions)
- Cascade/restrict deletion behavior
- Required fields cannot be null

#### Migration Tests
- `alembic upgrade head` on empty database succeeds
- `alembic downgrade -1` then `upgrade head` succeeds
- Schema matches model definitions

#### Session Tests
- Create session → sets cookie, stores hash
- Lookup by token hash → finds session
- Expired session → rejected (401)
- Invalid token → rejected (401)
- Session scopes creator queries

#### Workspace Isolation Tests
- Creator A cannot read Creator B's forms (404)
- Creator A cannot modify Creator B's forms (404)
- Creator A cannot see Creator B's results (404)
- Cross-workspace access returns 404, not 403

#### Form CRUD Tests
- Create form → draft status, generated slug, default title
- List forms → only own forms, with counts
- Update title → persisted
- Duplicate → new ID, new slug, draft status, same content, no responses
- Delete → removes form and related data
- Search → filters by title substring

#### Publishing & Versioning Tests
- Publish → creates version, snapshots questions, sets status
- Publish with no questions → rejected
- Edit after publish → draft changes, live version unchanged
- Publish edits → new version, live version updated
- Unpublish → status draft, public link unavailable
- Version snapshot contains correct question data
- Responses reference correct version

#### Question Validation Tests
- Valid question types accepted
- Invalid types rejected
- Title length constraints enforced
- Required toggle works
- Choice-based types require at least one option
- Empty choice labels rejected
- Position uniqueness enforced
- Reorder updates all positions transactionally
- Reorder with missing/extra IDs rejected

#### Submission Tests
- Valid submission → persisted with all answers
- Missing required answers → rejected
- Unknown question IDs → rejected
- Wrong answer types → rejected
- Invalid email format → rejected
- Number out of range → rejected
- Idempotency: same key → 200 with original response
- Unpublished form → rejected
- Version mismatch → rejected (409)

#### Summary Calculation Tests
- Choice counts and percentages correct
- Number average, min, max correct
- Rating average and distribution correct
- Text/email returns recent values
- Empty form returns zero counts

#### Error Contract Tests
- All errors follow RFC 9457 format
- Correct status codes
- No stack traces in responses
- No SQL in error messages

#### Rate Limiting Tests
- Exceeding limit → 429
- Rate limit headers present
- Different categories have different limits

#### Security Tests
- XSS input stored as text, not HTML
- Unknown question IDs rejected in submission
- Submissions to unpublished forms rejected
- Transaction rollback on partial failure
- Proxy secret required for non-health routes
- CORS rejects unauthorized origins

### Pagination Tests
- Default page size works
- Custom page size works
- Page beyond results returns empty
- Total count is accurate

## 3. Frontend Testing

### Framework
- **Vitest** for unit/component tests
- **React Testing Library** for component interaction tests
- **MSW (Mock Service Worker)** for API mocking

### Coverage Areas

#### Workspace Component Tests
- Loading state renders skeletons
- Empty state renders CTA
- Error state renders retry button
- Forms render with correct data (title, status, count, time)
- Create button triggers API call
- Search input filters forms
- Three-dot menu opens with correct options
- Rename modal pre-fills current title
- Delete confirmation shows form name and response count
- Duplicate triggers API and refreshes list

#### Builder Component Tests
- Three-pane layout renders
- Question navigator lists questions in order
- Selecting question updates canvas and inspector
- Add question opens type picker
- Type picker shows all 8 types
- Canvas renders selected question preview
- Inspector shows correct settings for each type
- Required toggle updates question
- Title editing triggers autosave

#### Question Type Tests (for each of 8 types)
- Editor renders correct fields
- Renderer renders correct control
- Validation rules applied correctly
- Settings changes persist

#### Choice Editor Tests
- Add option appends to list
- Edit option updates label
- Delete option removes (minimum 1 enforced)
- Reorder options works
- Empty label prevented

#### Autosave Tests
- Debounces text edits (verify API call timing)
- Saves immediately on structural changes
- Shows "Saving…" during save
- Shows "Saved" after success
- Shows "Couldn't save" after failure
- Retry button triggers new save
- Multiple rapid edits → single save with latest data

#### Keyboard Reordering Tests
- Alt+↑ moves question up
- Alt+↓ moves question down
- Boundary: first question can't move up
- Boundary: last question can't move down
- Screen reader announcement after reorder

#### Preview Tests
- Preview button enters preview mode
- Shows question one-at-a-time
- Submit button shows "This is a preview"

#### Public Respondent Tests
- Renders first question on load
- Type-appropriate controls render
- Enter advances short text
- Ctrl+Enter advances long text
- Arrow keys navigate choices
- Letter keys select choices
- Required validation blocks advancement
- Email validation shows error
- Number validation shows error
- Back button preserves answers
- Progress bar updates correctly
- Submit button disables during submission
- Thank-you screen shows after success
- Error preserves answers and allows retry

#### Reduced Motion Tests
- Transitions respect prefers-reduced-motion
- Content still functions correctly

#### Results Component Tests
- Summary renders question cards
- Choice questions show bar charts
- Number questions show statistics
- Text questions show recent values
- Empty state renders correctly
- Responses table renders paginated data
- Click row opens detail view
- Individual response shows Q&A pairs
- Pagination controls work

#### Loading/Empty/Error States
- Every data-fetching component has loading state
- Every data-fetching component has error state with retry
- Every list component has empty state

## 4. End-to-End Tests

### Framework
- **Playwright** for cross-browser E2E tests
- Desktop (Chromium) and mobile (Webkit mobile) viewports

### Critical User Journeys

#### Journey 1: Full Creator Flow
1. Enter demo workspace → see workspace
2. Create form → navigate to builder
3. Add short text question → appears in navigator
4. Add multiple choice question with 3 options
5. Add email question (required)
6. Edit question titles
7. Reorder questions (drag and keyboard)
8. Reload page → verify persistence
9. Preview form → see respondent flow
10. Publish form → status changes
11. Navigate to Results → empty state

#### Journey 2: Respondent Flow
1. Open public link (no auth)
2. See first question with progress
3. Type answer → Enter → next question
4. Navigate back → answer preserved
5. Try to advance required question without answer → validation
6. Enter invalid email → validation
7. Complete all questions
8. Submit → thank-you screen
9. Verify response appears in creator's results

#### Journey 3: Results & Responses
1. Open Results → see summary cards
2. Verify counts match submissions
3. Navigate to Responses table
4. Click response → see full detail
5. Navigate between responses

#### Journey 4: Form Management
1. Rename form → title updates
2. Duplicate form → new draft appears
3. Edit draft → publish edits → live version updated
4. Unpublish → public link unavailable
5. Delete form → removed from workspace

#### Journey 5: Workspace Isolation
1. Create workspace A → create form
2. Create workspace B (different session)
3. Workspace B cannot see workspace A's forms

### Accessibility Scans
- Run `axe` on: workspace, builder, public form, results
- Check: landmarks, headings, labels, contrast, focus management

## 5. Test Organization

```
frontend/
├── src/
│   ├── __tests__/              # Unit/component tests mirror src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   └── e2e/                    # Playwright tests
│       ├── workspace.spec.ts
│       ├── builder.spec.ts
│       ├── respondent.spec.ts
│       ├── results.spec.ts
│       └── accessibility.spec.ts

backend/
├── tests/
│   ├── conftest.py             # Fixtures, test DB
│   ├── test_sessions.py
│   ├── test_forms.py
│   ├── test_questions.py
│   ├── test_submissions.py
│   ├── test_results.py
│   ├── test_security.py
│   └── test_validation.py
```

## 6. Testing Principles

1. **Test behavior, not implementation** — don't test internal state or mock away the thing being tested
2. **No snapshot-only tests** — snapshots supplement behavioral tests, don't replace them
3. **Integration over unit where valuable** — API tests that hit the database are more valuable than mocked service tests
4. **Realistic test data** — use factory patterns, not minimal stubs
5. **Each test is independent** — fresh database per test, no test ordering dependencies
6. **Tests accompany features** — no feature merges without corresponding tests
