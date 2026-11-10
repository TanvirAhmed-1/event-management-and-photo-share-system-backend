import config from "./app/config";
import { Server } from "http";
import app from "./app";
import { seedPackages, seedReviews } from "./app/utils/seed";
import { seedSuperAdmin } from "./app/seed/createSuperAdmin";
import { seedDynamicEngine } from "./app/utils/seedDynamicEngine";

let server: Server;

async function main() {
  try {
    // Seed packages
    await seedPackages();

    // Seed customer reviews
    await seedReviews();

    // Seed Super Admin
    await seedSuperAdmin();

    // Seed Dynamic Engine (Event Types, Services, Food, Assignments)
    await seedDynamicEngine();

    server = app.listen(config.port, () => {
      console.log("Server running on port ", config.port);
    });
  } catch (error) {
    console.error("Critical error during server startup:", error);
    process.exit(1);
  }
}

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log("Server closed");
    });
  }
  process.exit(1);
};

const unexpectedErrorHandler = (error: unknown) => {
  console.error("Unexpected error occurred:", error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

main();
