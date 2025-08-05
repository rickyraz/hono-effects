import { Effect, Context } from "effect"

export interface LoggerService {
  readonly info: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>
  readonly warn: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>
  readonly error: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>
  readonly debug: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>
}

export class Logger extends Context.Tag("app/Logger")<Logger, LoggerService>() {}

const formatMessage = (level: string, message: string, meta?: Record<string, unknown>): string => {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ""
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`
}

export const LoggerLive = Logger.of({
  info: (message, meta) => 
    Effect.sync(() => console.log(formatMessage("info", message, meta))),
  warn: (message, meta) => 
    Effect.sync(() => console.warn(formatMessage("warn", message, meta))),
  error: (message, meta) => 
    Effect.sync(() => console.error(formatMessage("error", message, meta))),
  debug: (message, meta) => 
    Effect.sync(() => console.debug(formatMessage("debug", message, meta))),
})