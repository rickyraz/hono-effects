import { Hono } from "hono"
import { Effect } from "effect"
import { Database } from "../services/database.js"
import { Validation } from "../services/validation.js"
import { Logger } from "../services/logger.js"
import { runEffect } from "../utils/effect-hono.js"

export const usersRouter = new Hono()

usersRouter.get("/", runEffect((c) =>
  Effect.gen(function* () {
    const database = yield* Database
    const logger = yield* Logger

    yield* logger.info("Fetching all users")
    const users = yield* database.getUsers()

    return { users }
  })
))

usersRouter.get("/:id", runEffect((c) =>
  Effect.gen(function* () {
    const database = yield* Database
    const validation = yield* Validation
    const logger = yield* Logger

    const rawId = c.req.param("id")
    const id = yield* validation.validateUserId(Number(rawId))

    yield* logger.info("Fetching user by ID", { id })
    const user = yield* database.getUserById(id)

    return { user }
  })
))

usersRouter.post("/", runEffect((c) =>
  Effect.gen(function* () {
    const database = yield* Database
    const validation = yield* Validation
    const logger = yield* Logger

    const rawData = yield* Effect.promise(() => c.req.json())
    const userData = yield* validation.validateCreateUser(rawData)

    yield* logger.info("Creating new user", { userData })
    const user = yield* database.createUser(userData)

    return { user }
  })
))

usersRouter.put("/:id", runEffect((c) =>
  Effect.gen(function* () {
    const database = yield* Database
    const validation = yield* Validation
    const logger = yield* Logger

    const rawId = c.req.param("id")
    const id = yield* validation.validateUserId(Number(rawId))

    const rawData = yield* Effect.promise(() => c.req.json())
    const validatedData = yield* validation.validateUpdateUser(rawData)

    // Filter out undefined values for exact optional property types
    const updateData: { readonly name?: string; readonly email?: string } = {
      ...(validatedData.name !== undefined && { name: validatedData.name }),
      ...(validatedData.email !== undefined && { email: validatedData.email })
    }

    yield* logger.info("Updating user", { id, updateData })
    const user = yield* database.updateUser(id, updateData)

    return { user }
  })
))

usersRouter.delete("/:id", runEffect((c) =>
  Effect.gen(function* () {
    const database = yield* Database
    const validation = yield* Validation
    const logger = yield* Logger

    const rawId = c.req.param("id")
    const id = yield* validation.validateUserId(Number(rawId))

    yield* logger.info("Deleting user", { id })
    yield* database.deleteUser(id)

    return { message: "User deleted successfully" }
  })
))