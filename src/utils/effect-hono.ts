import { Console, Effect, Exit } from "effect"
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
// const complexOperation = (input: string) =>
//   Effect.gen(function* () {
//     try {
//       // Operasi yang mungkin throw error non-Effect
//       const parsed = JSON.parse(input)
      
//       // Lanjut dengan Effect operations
//       const result = yield* Effect.succeed(parsed.value)
//       yield* Console.log(`Success: ${result}`)
      
//       return result
//     } catch (error) {
//       // Handle parsing error, lalu convert ke Effect error
//       return yield* Effect.fail(new Error(`Parse failed: ${error}`))
//     }
//   })

const parseJson = (json: string) =>
  Effect.try(() => JSON.parse(json))

// Untuk async operations yang bisa throw  
const fetchData = (url: string) =>
  Effect.tryPromise(() => fetch(url))

// Komposisi dengan error handling
const safeOperation = (input: string) =>
  parseJson(input)
    .pipe(
      Effect.flatMap(data => Effect.succeed(data.value)),
      Effect.tap(result => Console.log(`Success: ${result}`)),
      Effect.catchAll(error => 
        Effect.fail(new Error(`Operation failed: ${error.message}`))
      )
    )