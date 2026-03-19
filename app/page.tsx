import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Flower2, Users, CheckSquare } from "lucide-react"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center">
          <div className="rounded-full bg-pink-600/10 p-4 ring-1 ring-pink-500/20">
            <Flower2 className="h-12 w-12 text-pink-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white">마리 홈페이지</h1>
        <p className="text-lg text-gray-400">
          로스트아크 레이드 스케쥴을 쉽고 편리하게 관리하세요.
          <br />
          그룹을 만들고 파티를 편성하고 완료 현황을 추적하세요.
        </p>
        <div className="flex justify-center pt-2">
          <Link href="/login">
            <Button
              size="lg"
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              Discord로 시작하기
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
          {[
            {
              icon: <Flower2 className="h-5 w-5 text-pink-400" />,
              title: "레이드 추적",
              desc: "주간 레이드 완료 현황을 한눈에 확인",
            },
            {
              icon: <Users className="h-5 w-5 text-pink-400" />,
              title: "그룹 관리",
              desc: "공대원과 함께 파티를 편성하고 관리",
            },
            {
              icon: <CheckSquare className="h-5 w-5 text-pink-400" />,
              title: "완료 체크",
              desc: "레이드 완료 여부를 클릭 한 번으로 기록",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-left"
            >
              <div className="mb-2">{feature.icon}</div>
              <h3 className="font-semibold text-white text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
