# FormFlow — Product Specification

## 1. Product Vision

FormFlow is a Typeform-style form builder enabling creators to build, publish, and analyze interactive forms with a polished one-question-at-a-time respondent experience.

## 2. User Roles

### Creator
- Creates, edits, publishes, and manages forms
- Views responses and aggregate statistics
- Authenticated via simplified demo-creator session (not production auth)

### Respondent
- Completes published forms via public link
- No authentication required
- Full-screen, keyboard-first experience

## 3. Screens and Features

### 3.1 Forms Workspace (`/`)

**Purpose:** Central hub for all form management.

**Elements:**
- FormFlow logo/identity in header
- "Create form" prominent button (top-right)
- Search input for filtering forms
- Forms table/list with columns:
  - Form title
  - Status badge (Draft / Published)
  - Response count
  - Last updated timestamp
- Three-dot action menu per form:
  - Rename
  - Duplicate
  - Delete
  - Publish / Unpublish
  - Preview
  - Results

**States:**
- Loading: Skeleton placeholders for table rows
- Empty: Illustration + "Create your first form" CTA
- Error: Error message + "Retry" button
- Populated: Forms table with data

**Behaviors:**
- "Create form" → creates untitled form, navigates to builder
- Rename → inline edit or modal with current title pre-filled
- Duplicate → copies form content (not responses), creates new draft with new ID/slug
- Delete → confirmation dialog describing consequence ("This will permanently delete the form and all its responses")
- All mutations show toast feedback
- Search debounced at 300ms

### 3.2 Form Builder (`/forms/[id]/edit`)

**Purpose:** Three-pane editor for building forms.

#### 3.2.1 Header (~56-64px)
- Back arrow → workspace
- Inline-editable form title
- Autosave state indicator (Saving… / Saved / Couldn't save + Retry)
- Tab navigation: Content | Share | Results
- Preview button
- Publish / "Publish edits" button
- Overflow menu with Unpublish option

#### 3.2.2 Left Panel — Question Navigator (~240px)
- Ordered list of questions
- Each item shows:
  - Drag handle
  - Question number
  - Question-type icon
  - Truncated title
  - Selected state highlight
- "Add question" button at bottom
- Right-click or kebab menu per question: Duplicate, Delete
- Drag-and-drop reordering with:
  - Visual drop indicators
  - Keyboard support (Alt+↑/↓ or similar)
  - Transactional persistence

#### 3.2.3 Central Canvas (flexible width)
- Shows selected question as respondent will see it
- Inline editing of question title and description
- Question-type-appropriate answer preview
- Clear empty state when no questions exist
- Desktop/mobile preview toggle

#### 3.2.4 Right Panel — Settings Inspector (~300px)
- Question type selector (dropdown)
- Required toggle
- Description/help text input
- Type-specific settings:
  - **Multiple choice / Dropdown:** Choice list editor (add, edit, delete, reorder choices)
  - **Rating:** Scale configuration (1-5, 1-10)
  - **Number:** Min/max range (optional)
- "Theme" and "Thank-you screen" marked as "Coming soon"

#### 3.2.5 Autosave
- Debounce text edits (500ms)
- Save immediately on structural changes (add/delete/reorder/type change)
- Prevent stale writes from overwriting newer state (version counter or timestamp)
- Warn before navigation only when genuinely unsaved
- Recover from network failure with retry

### 3.3 Share Tab (`/forms/[id]/share`)

**Elements:**
- Public form URL display
- Copy link button
- Status indicator (Published / Draft — not yet available)
- If published: active link
- If draft: prompt to publish first

### 3.4 Preview (`/forms/[id]/preview` or modal)

- Shows form exactly as respondent will experience
- One-question-at-a-time flow
- No submission — informational only
- Close/exit button

### 3.5 Public Respondent Flow (`/f/[slug]`)

**Purpose:** The polished, animated form completion experience.

**Layout:**
- Full screen, centered content
- Top progress bar
- Question number with colored marker
- Large question text
- Help/description text below
- Type-appropriate answer control
- Primary action button ("OK" / "Submit")
- Bottom-right: Previous / Next navigation

**Question Types and Controls:**
| Type | Control |
|---|---|
| Short text | Single-line input |
| Long text | Multi-line textarea |
| Multiple choice | Clickable option cards with letter keys |
| Dropdown | Searchable select dropdown |
| Email | Email input with validation |
| Number | Numeric input with validation |
| Yes/No | Two large buttons |
| Rating | Star or number scale |

**Navigation & Keyboard:**
- Enter → advance (short text, email, number, yes/no)
- Ctrl/Cmd + Enter → advance (long text)
- Arrow keys → navigate choices/rating
- Enter → select choice
- Tab → logical tab order
- Previous button → go back (preserves answers)
- Required questions block advancement until answered

**Transitions:**
- 220-280ms directional slide
- Forward: slide up/left
- Backward: slide down/right
- Respects `prefers-reduced-motion`

**Validation:**
- Required field: "This question is required"
- Email: "Please enter a valid email address"
- Number: "Please enter a valid number"
- Validation appears inline next to control
- Focus moves to error

**Submission:**
- Submit button disabled during processing
- Idempotency key prevents duplicates
- Server validates against published version
- Success → thank-you screen
- Failure → preserve answers, show retry

**Thank-You Screen:**
- Confirmation message
- "Create your own form with FormFlow" branding link

### 3.6 Results — Summary (`/forms/[id]/results`)

**Elements:**
- Total submission count
- Per-question summary cards:
  - **Choice/Dropdown/Yes-No:** Bar chart with counts and percentages
  - **Rating:** Average, distribution
  - **Number:** Average, min, max, count
  - **Text/Email:** List of recent responses (sample)
- Empty state when no submissions

### 3.7 Results — Responses Table (`/forms/[id]/results/responses`)

**Elements:**
- Paginated table (20 per page)
- Columns: Submission # | Timestamp | Answer previews per question
- Horizontal scroll for many questions
- Click row → individual response view

### 3.8 Individual Response View

**Elements:**
- Response identifier
- Submission timestamp
- Full question-answer pairs
- Navigate between responses
- Close/back button

## 4. Required Question Types

| Type | Fields | Validation |
|---|---|---|
| Short text | title, description, required | Max length |
| Long text | title, description, required | Max length |
| Multiple choice | title, description, required, choices[] | At least one choice, no empty labels |
| Dropdown | title, description, required, choices[] | At least one choice, no empty labels |
| Email | title, description, required | Email format |
| Number | title, description, required, min?, max? | Numeric, range |
| Yes/No | title, description, required | Boolean |
| Rating | title, description, required, max_rating | 1-max_rating range |

## 5. Form Lifecycle

```
Created (Draft) → Published → [Edits create new draft version]
                              → Publish edits (replaces live version)
                              → Unpublish (preserves responses)
                              → Re-publish (same slug)
```

- Publishing is transactional: creates a snapshot version
- Edits after publish create a new draft without affecting live form
- "Publish edits" replaces the live version atomically
- Unpublishing makes public link return "Form not available"
- Historical responses always reference their answered version
- Public slug is stable across publishes

## 6. Non-Functional Requirements

- **Performance:** < 2s initial load, < 100ms interaction response
- **Accessibility:** WCAG AA, keyboard-first, screen reader compatible
- **Mobile:** Responsive workspace, excellent public respondent mobile UX
- **Security:** See `SECURITY.md`
- **Data integrity:** All mutations transactional, no silent data loss
