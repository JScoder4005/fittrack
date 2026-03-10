import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use Edge-compatible auth config (no Prisma/bcrypt) for middleware
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
