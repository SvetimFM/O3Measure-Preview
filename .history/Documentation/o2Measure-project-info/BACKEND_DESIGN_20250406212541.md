  Backend Architecture:
  - Simple REST API for object CRUD operations
  - AWS DynamoDB for object storage (scales well, low maintenance)
  - Auth0/Firebase Auth for user management (zero-code auth solution)
  - AWS S3 for static assets

  Key Benefits:
  1. Centralized object state (no ID passing complexity)
  2. Persistent objects across sessions
  3. Multi-device access to the same objects
  4. Cleaner code separation

  Frontend Architecture:
  - Local state for UI/interaction only
  - Redux/Context for session state
  - API client for backend communication
  - Simple JWT token storage for auth
