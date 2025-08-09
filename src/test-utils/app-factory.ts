import { Hono } from "hono"
import { cors } from "hono/cors"
import { prettyJSON } from "hono/pretty-json" 
import { secureHeaders } from "hono/secure-headers"
import { timing } from "hono/timing"
import { usersRouter } from "../routes/users.js"
import { healthRouter } from "../routes/health.js"

export function createTestApp() {
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

  return app
}