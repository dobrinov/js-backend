import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/util/password";

const prisma = new PrismaClient();

export async function seed() {
  await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      passwordDigest: hashPassword("1"),
    },
  });
}

seed();
