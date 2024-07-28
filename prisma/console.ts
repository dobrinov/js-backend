import { exec } from "child_process";
import "dotenv/config";

exec(`psql -d ${process.env.DATABASE_URL}`);
