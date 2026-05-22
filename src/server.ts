import config from "./app/config";
import { Server } from "http";
import app from "./app";
import { seedPackages, seedReviews } from "./app/utils/seed";
import { seedSuperAdmin } from "./app/seed/createSuperAdmin";

async function main() {
  // Seed packages
  await seedPackages();

  // Seed customer reviews
  await seedReviews();

  // Seed Super Admin
  await seedSuperAdmin();

  const server: Server = app.listen(config.port, () => {
    console.log("Server running on port ", config.port);
  });

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("Server closed");
      });
    }
    process.exit(1);
  };

  const unexpectedErrorHandler = (error: unknown) => {
    console.error(error);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);
}

main();
