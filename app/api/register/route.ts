import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, displayName, password, characters } = body as {
      username: string
      displayName: string
      password: string
      characters?: {
        name: string
        characterClass: string
        itemLevel: number
      }[]
    }

    if (!username || !displayName || !password) {
      return NextResponse.json(
        { error: "아이디, 이름, 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json(
        { error: "이미 사용 중인 아이디입니다." },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        passwordHash,
        ...(characters && characters.length > 0
          ? {
              characters: {
                create: characters.map((c) => ({
                  name: c.name,
                  characterClass: c.characterClass,
                  itemLevel: c.itemLevel,
                })),
              },
            }
          : {}),
      },
      include: { characters: true },
    })

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
