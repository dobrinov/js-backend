import { compareSync, hashSync } from "bcrypt";

export function hashPassword(value: string): string {
  return hashSync(value, 10);
}

export function checkPassword(value: string, hash: string): boolean {
  return compareSync(value, hash);
}
