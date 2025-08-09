import { Config } from "effect"

export const AppConfig = {
  port: Config.integer("PORT").pipe(Config.withDefault(3455)),
  nodeEnv: Config.string("NODE_ENV").pipe(Config.withDefault("development")),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
  databaseUrl: Config.string("DATABASE_URL").pipe(
    Config.withDefault("sqlite://data.db")
  ),
} as const

export type AppConfigType = typeof AppConfig