import { Context as HonoContext, Next } from "hono"
import { Effect } from "effect"
import { Logger } from "../services/logger.js"
import { AppLive } from "../layers/app.js"

export const requestLoggerMiddleware = () => {
  return async (c: HonoContext, next: Next) => {
    const start = Date.now()
    const method = c.req.method
    const path = c.req.path
    const userAgent = c.req.header("user-agent") || "unknown"

    const logEffect = Effect.gen(function* () {
      const logger = yield* Logger
      yield* logger.info("Request started", {
        method,
        path,
        userAgent,
        timestamp: new Date().toISOString()
      })
    }).pipe(Effect.provide(AppLive))

    await Effect.runPromise(logEffect).catch(console.error)

    await next()

    const duration = Date.now() - start
    const status = c.res.status

    const logResponseEffect = Effect.gen(function* () {
      const logger = yield* Logger
      yield* logger.info("Request completed", {
        method,
        path,
        status,
        duration,
        timestamp: new Date().toISOString()
      })
    }).pipe(Effect.provide(AppLive))

    await Effect.runPromise(logResponseEffect).catch(console.error)
  }
}