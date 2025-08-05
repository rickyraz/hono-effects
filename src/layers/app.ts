import { Layer } from "effect"
import { Logger, LoggerLive } from "../services/logger.js"
import { DatabaseLive } from "../services/database.js"
import { Validation, ValidationLive } from "../services/validation.js"

export const AppLive = Layer.mergeAll(
  Layer.succeed(Logger, LoggerLive),
  Layer.succeed(Validation, ValidationLive),
  DatabaseLive
).pipe(
  Layer.provide(Layer.succeed(Logger, LoggerLive))
)