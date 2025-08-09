import { Layer, Context } from "effect"
import { Logger, LoggerLive } from "../services/logger.js"
import { DatabaseLive } from "../services/database.js"
import { Validation, ValidationLive } from "../services/validation.js"
import { AppConfig } from "../config/env.js"

// Create a Context tag for AppConfig to enable DI
class AppConfigService extends Context.Tag("AppConfig")<AppConfigService, typeof AppConfig>() {}

// Create layer for AppConfig  
export const AppConfigLive = Layer.succeed(AppConfigService, AppConfig)

// AppLive = Mall besar yang jual semua barang
// DatabaseLive = Pabrik yang bikin database

// Masalahnya: Pabrik itu terpisah dari Mall!
export const AppLive = Layer.mergeAll(
  AppConfigLive,
  Layer.succeed(Logger, LoggerLive),
  Layer.succeed(Validation, ValidationLive),
  DatabaseLive.pipe(Layer.provide(Layer.succeed(Logger, LoggerLive)))
  // Sebelum masak Database, siapin Logger dulu ya! = Artinya: "Khusus buat pabrik Database ini, kasih Logger dulu sebelum mulai produksi"
)


// --- Bikin "Kitchen Dependencies" terpisah
// const KitchenDependencies = Layer.mergeAll([
//   Layer.succeed(Chef, HeadChefLive),
//   Layer.succeed(Ingredients, IngredientsLive)
// ])

// const RestaurantLive = Layer.mergeAll([
//   Layer.succeed(Waiter, WaiterLive),
//   KitchenLive.pipe(Layer.provide(KitchenDependencies))
// ])

// Export the service tag for use in other files
export { AppConfigService }