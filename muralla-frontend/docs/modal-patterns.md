# Modal Implementation Patterns

## ❌ Anti-Pattern: Sibling Overlay Structure

**Problem**: Modal closes when clicking form fields due to event bubbling through flex containers.

```tsx
// DON'T DO THIS - causes click propagation issues
<div className="fixed inset-0">
  <div className="flex justify-center">
    <div onClick={onClose} className="fixed inset-0 bg-overlay" />
    <div onClick={stopPropagation} className="modal-content">
      <input /> {/* Clicks bubble to parent container */}
    </div>
  </div>
</div>
```

## ✅ Correct Pattern: Top-Level Click Handler

```tsx
// DO THIS - proper event isolation
<div className="fixed inset-0" onClick={onClose}>
  <div className="fixed inset-0 bg-gray-500 bg-opacity-25" />
  <div className="flex justify-center">
    <div 
      onClick={(e) => e.stopPropagation()} 
      className="modal-content relative z-10"
    >
      <input /> {/* Clicks properly stopped here */}
    </div>
  </div>
</div>
```

## Key Rules

1. **onClick={onClose}** goes on the outermost container
2. **Background overlay** should be a separate element (not clickable)
3. **Modal content** needs `onClick={(e) => e.stopPropagation()}`
4. **Modal content** needs higher z-index (`z-10` or higher)

## Debugging Tips

- If modal closes on form field clicks → check event propagation structure
- Use browser DevTools to inspect click event path
- Test with `console.log` in onClick handlers to trace event flow
