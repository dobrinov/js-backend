import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/util/password";

const prisma = new PrismaClient();

export async function seed() {
  await prisma.user.create({
    data: {
      name: "John Doe",
      email: "admin@example.com",
      role: "ADMIN",
      passwordDigest: hashPassword("1"),
    },
  });

  await prisma.user.create({
    data: {
      name: "Jane Doe",
      email: "basic@example.com",
      role: "BASIC",
      passwordDigest: hashPassword("1"),
    },
  });
}

seed();
