# XR Implementation Guide for LLMs

## Initial Review Steps

1. First review the `/Documentation/xr_integration.md` and `/Documentation/xr_issues.md` files to understand the core requirements and current issues
W for Meta Quest 
    - Very well-documented with many examples specifically for Quest
## Implementation Priority Sequence

Implement fixes in this specific order to ensure proper XR integration:

1. **XR Session Management**
   - Fix the session initialization in `App.jsx`
   - Implement proper error handling for XR session establishment
   - Add device compatibility detection

2. **Controller Input Optimization**

3. **Hand Tracking Enhancement**
   - Add feature detection for hand tracking
   - Implement proper fallbacks when hand tracking isn't available
   - Add visual feedback for hand presence

4. **UI Panel Improvements**
   - Make UI follow user in more ergonomic ways - attach it to the left wrist and position it facing the user - then stop its rotaiton 
   - Implement proper XR-optimized interactions for UI elements

5. **Performance Optimization**
   - Optimize flow for XR requirements and best practices
   - Use references instead of state for Three.js objects
   - Implement proper cleanup for XR resources

## Testing Requirements

After each implementation step:
1.

## Best Practices for Implementation

- Use selective imports from libraries to minimize bundle size
- Add comments explaining XR-specific logic
- Create reusable components for common XR interactions
- Follow the 2-space indentation and code style from existing files