import { exec } from "child_process";
import "dotenv/config";
import { seed } from "./seed";

async function execute() {
  console.log("Dropping database...");
  await exec(`dropdb ${process.env.DATABASE_URL}`);
  console.log("Creating database...");
  await exec("prisma migrate dev");
  console.log("Seeding database...");
  await seed();
}

execute();
