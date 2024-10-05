import { User } from "@prisma/client";

export type Context = {
  currentUser: Promise<User>;
};
