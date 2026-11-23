import "server-only";
import { cookies } from "next/headers";
import { COOKIE, readToken } from "./session";

export async function currentRole() {
  return readToken((await cookies()).get(COOKIE)?.value);
}
