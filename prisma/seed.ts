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

  for (let index = 1; index <= 10; index++) {
    await prisma.user.create({
      data: {
        name: `Wildcard Doe ${index}`,
        email: `npc-${index}@example.com`,
        role: "BASIC",
        passwordDigest: hashPassword("1"),
      },
    });
  }
}

seed();
