import { Effect, Exit } from "effect"
import { Context as HonoContext } from "hono"
import { AppLive } from "../layers/app.js"
import { DatabaseError } from "../services/database.js"
import { ValidationError } from "../services/validation.js"

export type EffectHandler<E, A, R = never> = (c: HonoContext) => Effect.Effect<A, E, R>

export const runEffect = <E, A, R = any>(
  handler: EffectHandler<E, A, R>
) => {
  return async (c: HonoContext) => {
    const effect = Effect.provide(handler(c), AppLive) as Effect.Effect<A, E, never>
    const exit = await Effect.runPromiseExit(effect)

    return Exit.match(exit, {
      onFailure: (cause) => {
        const error = cause._tag === "Fail" ? cause.error : new Error("Unknown error")
        
        if (error instanceof ValidationError) {
          return c.json({ 
            error: "Validation failed", 
            details: error.errors 
          }, 400)
        }
        
        if (error instanceof DatabaseError) {
          return c.json({ 
            error: "Database error", 
            message: error.message 
          }, 500)
        }

        console.error("Unhandled error:", error)
        return c.json({ error: "Internal server error" }, 500)
      },
      onSuccess: (value: any) => {
        if (typeof value === "object" && value !== null) {
          return c.json(value)
        }
        return c.json({ data: value })
      }
    })
  }
}