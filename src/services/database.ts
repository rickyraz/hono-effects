import { Effect, Context, Layer } from "effect"
import { Logger } from "./logger.js"

export interface User {
  readonly id: number
  readonly name: string
  readonly email: string
  readonly createdAt: Date
}

export interface DatabaseService {
  readonly getUsers: () => Effect.Effect<readonly User[], DatabaseError>
  readonly getUserById: (id: number) => Effect.Effect<User, DatabaseError>
  readonly createUser: (data: Pick<User, "name" | "email">) => Effect.Effect<User, DatabaseError>
  readonly updateUser: (id: number, data: { readonly name?: string; readonly email?: string }) => Effect.Effect<User, DatabaseError>
  readonly deleteUser: (id: number) => Effect.Effect<void, DatabaseError>
}

export class DatabaseError extends Error {
  readonly _tag = "DatabaseError"
  constructor(message: string, readonly cause?: unknown) {
    super(message)
  }
}

export class Database extends Context.Tag("app/Database")<Database, DatabaseService>() {}

const mockUsers: User[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    createdAt: new Date("2024-01-01")
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    createdAt: new Date("2024-01-02")
  }
]

let nextId = 3

export const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const logger = yield* Logger

    yield* logger.info("Initializing database connection")

    return {
      getUsers: () => 
        Effect.gen(function* () {
          yield* logger.debug("Fetching all users")
          return mockUsers
        }),

      getUserById: (id: number) =>
        Effect.gen(function* () {
          yield* logger.debug("Fetching user by ID", { id })
          const user = mockUsers.find(u => u.id === id)
          if (!user) {
            return yield* Effect.fail(new DatabaseError(`User with id ${id} not found`))
          }
          return user
        }),

      createUser: (data: Pick<User, "name" | "email">) =>
        Effect.gen(function* () {
          yield* logger.info("Creating new user", { data })
          const user: User = {
            id: nextId++,
            name: data.name,
            email: data.email,
            createdAt: new Date()
          }
          mockUsers.push(user)
          return user
        }),

      updateUser: (id: number, data: { readonly name?: string; readonly email?: string }) =>
        Effect.gen(function* () {
          yield* logger.info("Updating user", { id, data })
          const userIndex = mockUsers.findIndex(u => u.id === id)
          if (userIndex === -1) {
            return yield* Effect.fail(new DatabaseError(`User with id ${id} not found`))
          }
          const updatedUser = { ...mockUsers[userIndex]!, ...data }
          mockUsers[userIndex] = updatedUser
          return updatedUser
        }),

      deleteUser: (id: number) =>
        Effect.gen(function* () {
          yield* logger.info("Deleting user", { id })
          const userIndex = mockUsers.findIndex(u => u.id === id)
          if (userIndex === -1) {
            return yield* Effect.fail(new DatabaseError(`User with id ${id} not found`))
          }
          mockUsers.splice(userIndex, 1)
        })
    }
  })
)