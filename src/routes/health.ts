import { Hono } from "hono"
import { Effect } from "effect"
import { Logger } from "../services/logger.js"
import { runEffect } from "../utils/effect-hono.js"

export const healthRouter = new Hono()

healthRouter.get("/", runEffect((c) =>
  Effect.gen(function* () {
    const logger = yield* Logger
    
    yield* logger.debug("Health check requested")
    
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0"
    }
  })
))

healthRouter.get("/ready", runEffect((c) =>
  Effect.gen(function* () {
    const logger = yield* Logger
    
    yield* logger.debug("Readiness check requested")
    
    return {
      status: "ready",
      timestamp: new Date().toISOString(),
      services: {
        database: "healthy",
        validation: "healthy",
        logger: "healthy"
      }
    }
  })
))