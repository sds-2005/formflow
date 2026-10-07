# FormFlow — Interaction Contracts

## 1. Workspace Interactions

### Form Creation
- Click "Create form" → API creates form → navigate to builder → focus title input
- Title defaults to "Untitled form"
- Toast: "Form created"

### Form Rename
- Three-dot menu → Rename → modal with current title pre-filled → focus input → Enter or Save button
- Validation: 1-200 characters, trimmed
- Toast: "Form renamed"

### Form Duplication
- Three-dot menu → Duplicate → API creates copy → table refreshes
- Copy receives title "{original} (copy)"
- Copy is always Draft, receives new ID and slug
- Responses are NOT copied
- Toast: "Form duplicated"

### Form Deletion
- Three-dot menu → Delete → confirmation dialog
- Dialog text: "Delete '{title}'? This will permanently delete this form and all {n} responses. This action cannot be undone."
- Two buttons: Cancel (default focus), Delete (danger styling)
- Toast: "Form deleted"
- Table refreshes, removed form disappears

### Search
- Debounced at 300ms
- Filters by form title (case-insensitive substring)
- Clears search: X button or empty input
- No results: "No forms match your search"

## 2. Builder Interactions

### Title Editing
- Click title in header → inline edit mode
- Enter or blur → save
- Escape → revert
- Empty title reverts to "Untitled form"

### Question Selection
- Click question in navigator → selected state, canvas shows question, inspector shows settings
- First question auto-selected on builder load
- Creating new question → auto-selects it

### Adding Questions
- Click "Add question" → opens type picker
- Type picker: grid/list of 8 types with icons and labels
- Select type → creates question with default title ("Untitled question")
- New question appended at end
- Auto-selected after creation
- Canvas focuses the title for immediate editing
- Autosave triggers immediately

### Editing Question Content
- Question title: inline edit on canvas, syncs to navigator
- Description: inline edit on canvas or via inspector
- Changes debounced for autosave (500ms)

### Question Type Change
- Inspector dropdown → select new type
- Preserves: title, description, required
- Resets type-specific settings (choices cleared when changing FROM choice-based)
- Warning if changing from choice-based type with existing choices: "Changing type will remove your choices. Continue?"
- Immediate autosave

### Required Toggle
- Inspector toggle switch
- Immediate autosave
- Visual indicator on navigator item (optional)

### Choice Editing (Multiple Choice / Dropdown)
- Add choice: "Add option" button or Enter after last choice
- Edit choice: inline text editing
- Delete choice: X button per choice (minimum 1 choice enforced)
- Reorder choices: drag handles
- Empty choice label prevented (trim + validate)
- Each choice gets a stable ID

### Drag-and-Drop Reordering
- **Pointer:** grab drag handle, visual clone follows pointer, drop indicators show valid positions
- **Keyboard:** focus question item → Alt+↑ moves up, Alt+↓ moves down
- Cancel: Escape
- Drop → positions update → autosave (transactional)
- Announcements: "Question moved from position 3 to position 1"
- Library: dnd-kit with @dnd-kit/sortable

### Question Duplication
- Three-dot menu on navigator item → Duplicate
- Copies: type, title, description, required, type-specific settings, choices
- Inserted after original
- Receives new ID
- Auto-selected
- Autosave triggers

### Question Deletion
- Three-dot menu on navigator item → Delete
- If only question: "Are you sure? This will leave the form empty."
- If one of many: confirm inline (small confirmation or direct with undo toast)
- Selection moves to adjacent question
- Autosave triggers

### Autosave State Machine
```
IDLE → [edit detected] → DEBOUNCING → [debounce expires] → SAVING → [API success] → SAVED → IDLE
                                                          → [API failure] → ERROR → [retry click] → SAVING
                                                          → [new edit during save] → DEBOUNCING (queue)
```

**States displayed:**
| State | Display | Action |
|---|---|---|
| IDLE | (hidden) | - |
| DEBOUNCING | (hidden) | - |
| SAVING | "Saving…" (subtle) | - |
| SAVED | "Saved" (fades after 2s) | - |
| ERROR | "Couldn't save" (persistent) | "Retry" button |

**Race prevention:**
- Each save carries a local version counter
- Server returns the accepted version
- If a newer version was saved during in-flight request, the response is discarded and a new save fires
- Reorder operations are immediate (not debounced) and transactional

### Navigation Warning
- Only warn if there is genuinely unsaved content (DEBOUNCING or SAVING state)
- Use `beforeunload` event
- Toast or browser dialog: "You have unsaved changes. Leave anyway?"

### Preview
- Header "Preview" button → opens preview mode
- Preview shows the form in respondent mode (one-at-a-time)
- No actual submission — "Submit" button shows "This is a preview"
- Close button returns to builder
- Can be in-page or modal overlay

### Publish
- "Publish" button → API creates published version → toast "Form published" → Share tab shows active link
- If already published with edits: button reads "Publish edits" → replaces live version
- Unpublish: overflow menu → "Unpublish" → confirmation → public link deactivated → toast "Form unpublished"
- Cannot publish with 0 questions: "Add at least one question before publishing"
- Cannot publish with validation errors (empty choice labels, etc.)

## 3. Respondent Flow Interactions

### Initial Load
- Fetch published form by slug
- If not found or unpublished: "This form is no longer available" screen
- If found: show first question with entrance animation

### Question Display
- Full-screen centered layout
- Progress bar at top (percentage or fraction)
- Question number with colored marker
- Large question text
- Description below (if present)
- Answer control below description
- "OK" / primary action button below answer
- Previous / Next buttons bottom-right

### Answer Input by Type

#### Short Text
- Single-line input, auto-focused
- Enter → advance (if valid)
- Max length enforced with counter

#### Long Text
- Multi-line textarea, auto-focused
- Ctrl/Cmd + Enter → advance
- Enter → newline (normal behavior preserved)
- "Press Ctrl+Enter to continue" hint
- Max length enforced with counter

#### Multiple Choice
- Option cards with letter keys (A, B, C, …)
- Click or press letter key → select
- Arrow keys navigate between options
- Enter → confirm selection and advance
- Selected option highlighted

#### Dropdown
- Searchable select component
- Auto-focused on open
- Arrow keys navigate
- Enter → select and advance
- Type to filter

#### Email
- Email input, auto-focused
- Enter → validate and advance
- Validation: standard email format
- Error: "Please enter a valid email address"

#### Number
- Numeric input, auto-focused
- Enter → validate and advance
- Validation: is a number, within range if specified
- Error: "Please enter a valid number" or "Please enter a number between {min} and {max}"

#### Yes/No
- Two large buttons: "Yes" and "No"
- Click → select and auto-advance
- Y key → Yes, N key → No
- Arrow keys toggle between options

#### Rating
- Star or numbered scale (1 to max)
- Click to select
- Arrow keys to adjust
- Enter → confirm and advance
- Visual fill effect

### Transitions
- Duration: 250ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Forward: current question slides up/fades, next slides up from below
- Backward: current slides down/fades, previous slides down from above
- `prefers-reduced-motion`: instant switch, no animation

### Validation
- Required questions: "This question is required" — shown when attempting to advance without answer
- Type validation (email, number): shown on advance attempt
- Validation message appears below the answer control
- Focus moves to the errored input
- ARIA live region announces errors

### Submission
- Final question "OK" → shows "Submit" button
- Click Submit → button shows loading spinner, disabled
- Client generates idempotency key (UUID stored in sessionStorage)
- POST to submit endpoint
- Success → thank-you screen with smooth transition
- Failure → preserve answers, show error toast, enable retry
- Already submitted (same idempotency key) → treat as success

### Thank-You Screen
- "Thanks for completing this form!"
- FormFlow branding: "Powered by FormFlow"
- Optional: "Create your own form" link

## 4. Results Interactions

### Summary View
- Per-question card layout
- Choice/dropdown/yes-no: horizontal bar chart with count + percentage
- Rating: average score, distribution
- Number: average, min, max, count
- Text/email: recent responses list (last 5-10)
- Empty state: "No responses yet"

### Responses Table
- Paginated (20 per page)
- Columns: # | Submitted at | First few question answers
- Click row → drawer/panel with full response
- Horizontal scroll for many columns
- Page navigation: Previous / Next / page numbers

### Individual Response
- Full Q&A pairs
- Timestamp
- Response number
- Previous/Next response navigation
- Close → back to table

## 5. Toast Notifications

**Placement:** Bottom-right, stacked  
**Duration:** Success: 4s auto-dismiss | Error: persistent until dismissed  
**Animation:** Slide up + fade in, slide down + fade out  

| Action | Toast |
|---|---|
| Form created | ✓ "Form created" |
| Form renamed | ✓ "Form renamed" |
| Form duplicated | ✓ "Form duplicated" |
| Form deleted | ✓ "Form deleted" |
| Form published | ✓ "Form published — it's live!" |
| Form unpublished | ✓ "Form unpublished" |
| Question deleted | ✓ "Question deleted" |
| Copy link | ✓ "Link copied to clipboard" |
| Save error | ✗ "Couldn't save. Retry?" |
| Network error | ✗ "Connection lost. Check your network." |
| Submission success | ✓ (Thank-you screen, not a toast) |
| Submission error | ✗ "Submission failed. Your answers are preserved — please try again." |

## 6. Keyboard Shortcuts

### Workspace
| Key | Action |
|---|---|
| / | Focus search |

### Builder
| Key | Action |
|---|---|
| Alt + ↑ | Move selected question up |
| Alt + ↓ | Move selected question down |
| Ctrl/Cmd + S | Force save (visual feedback only — autosave handles persistence) |
| Delete/Backspace | Delete selected question (with confirmation) |

### Respondent
| Key | Action |
|---|---|
| Enter | Advance (short text, email, number, choice confirm) |
| Ctrl/Cmd + Enter | Advance (long text) |
| ↑/↓ | Navigate choices/rating |
| A-Z | Select choice by letter |
| Y/N | Select Yes/No |
| Tab | Next focusable element |
| Shift + Tab | Previous focusable element |

## 7. Accessibility Announcements

- Question change: "[Question number]. [Question text]"
- Validation error: "Error: [message]"
- Save state: "Form saved" / "Couldn't save form"
- Question reorder: "Question [title] moved to position [n]"
- Form published: "Form published"
- Submission complete: "Your response has been recorded"
