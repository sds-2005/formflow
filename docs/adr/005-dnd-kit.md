# ADR-005: dnd-kit for Drag-and-Drop

**Status:** Accepted  
**Date:** 2026-10-07

## Context
The builder requires drag-and-drop reordering for:
- Questions in the navigator panel
- Choice options in the inspector

Requirements:
- Pointer (mouse/touch) drag support
- Keyboard accessibility (screen readers)
- Visual drop indicators
- Smooth animations
- React 18+ compatibility
- Maintained library

## Decision
Use **@dnd-kit/core** and **@dnd-kit/sortable** for drag-and-drop.

## Consequences
### Positive
- Purpose-built for React with hooks-based API
- First-class keyboard and screen reader accessibility
- Sortable preset handles the common reorder case
- Collision detection strategies for custom behavior
- Lightweight (~10KB gzipped)
- Active maintenance

### Negative
- Slightly lower-level API than react-beautiful-dnd (more setup)
- Requires manual announcements for screen readers

### Alternatives Considered
- **react-beautiful-dnd:** Deprecated, React 18 StrictMode issues
- **@hello-pangea/dnd:** Fork of react-beautiful-dnd, better maintained but heavier
- **Custom implementation:** Too much work for accessibility
- **HTML5 Drag and Drop:** Poor accessibility, inconsistent mobile support

### Keyboard Strategy
- Focus on drag handle → Enter to pick up → Arrow keys to move → Enter to drop → Escape to cancel
- Also support Alt+↑/↓ shortcuts for quick reorder without drag mode
- ARIA live region announces position changes
