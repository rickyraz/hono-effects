import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { Effect, Layer } from "effect"
import { AppConfig } from "./config/env.js"
import { AppLive } from "./layers/app.js"
import { usersRouter } from "./routes/users.js"
import { healthRouter } from "./routes/health.js"
import { requestLoggerMiddleware } from "./middleware/request-logger.js"
import { Logger } from "./services/logger.js"

const app = new Hono()

app.use("*", cors())
app.use("*", requestLoggerMiddleware())

app.route("/api/users", usersRouter)
app.route("/health", healthRouter)

app.get("/", (c) => {
  return c.json({
    message: "Hono + Effect-TS API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      users: "/api/users",
      docs: "https://github.com/your-repo/hono-effectts"
    }
  })
})

const program = Effect.gen(function* () {
  const logger = yield* Logger
  const port = yield* AppConfig.port
  
  yield* logger.info("Starting server", { port })
  
  yield* Effect.async<void>((resume) => {
    const server = serve({
      fetch: app.fetch,
      port,
    })
    
    console.log(`🚀 Server running at http://localhost:${port}`)
    
    process.on("SIGINT", () => {
      console.log("\n👋 Shutting down server...")
      server.close()
      resume(Effect.succeed(undefined))
    })
    
    process.on("SIGTERM", () => {
      console.log("\n👋 Shutting down server...")
      server.close()
      resume(Effect.succeed(undefined))
    })
  })
})

const runnable = program.pipe(
  Effect.provide(AppLive),
  Effect.tapErrorCause((cause) => 
    Effect.sync(() => console.error("Application failed to start:", cause))
  )
)

Effect.runPromise(runnable).catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})