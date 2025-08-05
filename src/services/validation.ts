import { Effect, Context } from "effect"
import { Schema } from "@effect/schema"

export class ValidationError extends Error {
  readonly _tag = "ValidationError"
  constructor(message: string, readonly errors: readonly string[]) {
    super(message)
  }
}

export interface ValidationService {
  readonly validateCreateUser: (data: unknown) => Effect.Effect<CreateUserData, ValidationError>
  readonly validateUpdateUser: (data: unknown) => Effect.Effect<UpdateUserData, ValidationError>
  readonly validateUserId: (id: unknown) => Effect.Effect<number, ValidationError>
}

export class Validation extends Context.Tag("app/Validation")<Validation, ValidationService>() { }

export const CreateUserSchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
})

export const UpdateUserSchema = Schema.Struct({
  name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100))),
  email: Schema.optional(Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)))
})

export const UserIdSchema = Schema.Number.pipe(Schema.int(), Schema.positive())

export type CreateUserData = Schema.Schema.Type<typeof CreateUserSchema>
export type UpdateUserData = Schema.Schema.Type<typeof UpdateUserSchema>

export const ValidationLive = Validation.of({
  validateCreateUser: (data: unknown) =>
    Effect.gen(function* () {
      const result = yield* Schema.decodeUnknown(CreateUserSchema)(data)
      return result
    }).pipe(
      Effect.mapError(error =>
        new ValidationError("Invalid user data", [error.message])
      )
    ),

  validateUpdateUser: (data: unknown) =>
    Effect.gen(function* () {
      const result = yield* Schema.decodeUnknown(UpdateUserSchema)(data)
      return result
    }).pipe(
      Effect.mapError(error =>
        new ValidationError("Invalid user update data", [error.message])
      )
    ),

  validateUserId: (id: unknown) =>
    Effect.gen(function* () {
      const result = yield* Schema.decodeUnknown(UserIdSchema)(id)
      return result
    }).pipe(
      Effect.mapError(error =>
        new ValidationError("Invalid user ID", [error.message])
      )
    )
})