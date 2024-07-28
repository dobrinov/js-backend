import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seed() {
  await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      passwordDigest: "123456",
    },
  });
}

seed();
