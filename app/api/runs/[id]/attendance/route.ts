export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: runId } = await params
  const body = await req.json()
  const { status } = body as { status: "attending" | "absent" }

  if (!["attending", "absent"].includes(status)) {
    return NextResponse.json({ error: "status must be 'attending' or 'absent'" }, { status: 400 })
  }

  const run = await prisma.groupRun.findUnique({ where: { id: runId } })
  if (!run) {
    return NextResponse.json({ error: "파티를 찾을 수 없습니다." }, { status: 404 })
  }

  const attendance = await prisma.runAttendance.upsert({
    where: {
      runId_userId: {
        runId,
        userId: session.user.id,
      },
    },
    update: { status },
    create: {
      runId,
      userId: session.user.id,
      status,
    },
    include: { user: true },
  })

  return NextResponse.json(attendance)
}
