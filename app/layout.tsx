import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { Navbar } from "@/components/Navbar"
import { AppSidebar } from "@/components/AppSidebar"
import { BottomNav } from "@/components/BottomNav"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "마리 홈페이지",
  description: "로스트아크 레이드 관리 시스템",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  let groups: { id: string; name: string }[] = []
  if (session?.user?.id) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { joinedAt: "asc" },
    })
    groups = memberships.map((m) => ({ id: m.group.id, name: m.group.name }))
  }

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <Providers>
          <Navbar />
          <div className="flex flex-1">
            {session && <AppSidebar groups={groups} />}
            <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
