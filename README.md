# Hono + Effect-TS Integration

A modern backend framework combining **Hono** (lightweight web framework) with **Effect-TS** (functional programming library) following MCP (Model Context Protocol) best practices.

## Features

- 🚀 **Hono Framework**: Fast, lightweight, and built on Web Standards
- ⚡ **Effect-TS**: Powerful functional programming with type-safe error handling
- 🏗️ **Layered Architecture**: Clean dependency injection using Effect-TS layers
- 🔍 **Type-Safe Validation**: Schema validation using @effect/schema
- 📝 **Structured Logging**: Effect-TS based logging with contextual information
- 🔧 **Configuration Management**: Environment-based configuration with defaults
- 🧪 **Testing Ready**: Vitest setup with coverage reporting
- 📦 **TypeScript**: Full type safety throughout the application

## Project Structure

```
src/
├── config/          # Configuration management
├── services/        # Business logic services (Database, Logger, Validation)
├── layers/          # Effect-TS dependency injection layers
├── routes/          # HTTP route handlers
├── middleware/      # Hono middleware
├── utils/           # Utility functions (Effect-Hono integration)
└── index.ts         # Application entry point
```

## Key Architectural Patterns

### Effect-TS Service Pattern
Services are defined as interfaces with Effect-TS tags for dependency injection:

```typescript
export class Database extends Context.Tag("app/Database")<Database, DatabaseService>() {}
```

### Layer-based Dependency Management
Dependencies are managed through composable layers:

```typescript
export const AppLive = Layer.mergeAll(
  Layer.succeed(Logger, LoggerLive),
  Layer.succeed(Validation, ValidationLive),
  DatabaseLive
)
```

### Effect-Hono Integration
Custom utility function bridges Effect-TS with Hono handlers:

```typescript
export const runEffect = <E extends Error, A>(
  handler: EffectHandler<E, A>
) => // Provides services and handles errors automatically
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hono-effectts

# Install dependencies  
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev         # Start development server with hot reload
npm run build       # Build for production
npm run start       # Start production server
npm run test        # Run tests
npm run test:coverage # Run tests with coverage
npm run lint        # Lint code
npm run typecheck   # Type checking
```

## API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe with service status

### Users API
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Example Requests

```bash
# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Get all users
curl http://localhost:3000/api/users
```

## Effect-TS Best Practices Implemented

1. **Service Layer Pattern**: Clean separation of concerns with tagged services
2. **Layer Composition**: Dependency injection through composable layers  
3. **Error Handling**: Type-safe error handling with custom error types
4. **Configuration Management**: Environment-based config with Effect Config
5. **Functional Programming**: Leveraging Effect generators for readable async code
6. **Resource Management**: Proper resource lifecycle management

## Environment Variables

```env
PORT=3000                    # Server port
NODE_ENV=development         # Environment (development/production)
LOG_LEVEL=info              # Logging level (debug/info/warn/error)
DATABASE_URL=sqlite://data.db # Database connection string
```

## Development

### Adding New Services

1. Create service interface and tag in `src/services/`
2. Implement service layer in same file
3. Add to `src/layers/app.ts` layer composition
4. Use in routes via Effect generators

### Error Handling

Custom error types extend base Error with `_tag` property for pattern matching:

```typescript
export class DatabaseError extends Error {
  readonly _tag = "DatabaseError"
  constructor(message: string, readonly cause?: unknown) {
    super(message)
  }
}
```

### Testing

Services can be easily mocked using Effect-TS test layers:

```typescript
const DatabaseTest = Layer.succeed(Database, {
  getUsers: () => Effect.succeed([]),
  // ... other methods
})
```

## Contributing

1. Follow TypeScript strict mode
2. Use Effect-TS patterns for async operations
3. Add proper error handling with custom error types
4. Include tests for new functionality
5. Follow existing code style and conventions

## License

MIT