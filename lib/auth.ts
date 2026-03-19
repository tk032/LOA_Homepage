import { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "discord" && profile) {
        const p = profile as {
          id: string
          username: string
          global_name?: string
          avatar?: string
        }
        const image = p.avatar
          ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png`
          : null

        await prisma.user.upsert({
          where: { discordId: p.id },
          update: {
            username: p.username,
            displayName: p.global_name ?? p.username,
            image,
          },
          create: {
            discordId: p.id,
            username: p.username,
            displayName: p.global_name ?? p.username,
            image,
          },
        })
      }
      return true
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "discord" && profile) {
        const p = profile as { id: string; username: string }
        const user = await prisma.user.findUnique({ where: { discordId: p.id } })
        if (user) {
          token.id = user.id
          token.username = user.username
          token.image = user.image
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.image = token.image as string | null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
