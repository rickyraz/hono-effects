import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { secureHeaders } from "hono/secure-headers"
import { timing } from "hono/timing"
import { Effect } from "effect"
import { AppLive, AppConfigService } from "./layers/app.js"
import { usersRouter } from "./routes/users.js"
import { healthRouter } from "./routes/health.js"
import { Logger } from "./services/logger.js"

const app = new Hono()

// Security middleware
app.use("*", secureHeaders())

// CORS middleware
app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true
}))

// Performance middleware
app.use("*", timing())

// Development middleware (JSON formatting)
app.use("*", prettyJSON())

// Logging middleware (Hono built-in only)
app.use("*", logger())

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
  const config = yield* AppConfigService
  const port = yield* config.port
  
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
  Effect.provide(AppLive), //  langsung dapet semua dari semua Toko(layer) yang di mergeAll menjadi Supermarket
  Effect.tapErrorCause((cause) => 
    Effect.sync(() => console.error("Application failed to start:", cause))
  )
)

Effect.runPromise(runnable).catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})