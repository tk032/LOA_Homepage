import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">개인정보 처리방침</h1>
        <p className="text-gray-400 text-sm">최종 수정일: 2026년 3월</p>
      </div>

      <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-white mb-3">1. 수집하는 정보</h2>
          <p>Discord OAuth 로그인 시 아래 정보만 수집합니다.</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-gray-400">
            <li>Discord 사용자명 (username)</li>
            <li>Discord 표시 이름 (display name)</li>
            <li>Discord 프로필 사진 URL</li>
            <li>Discord 고유 ID (내부 식별용)</li>
          </ul>
          <p className="mt-2 text-gray-400">이메일, 전화번호 등 민감한 개인정보는 수집하지 않습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">2. 수집 목적</h2>
          <ul className="mt-2 space-y-1 list-disc list-inside text-gray-400">
            <li>로스트아크 레이드 관리 서비스 제공</li>
            <li>로그인 및 세션 유지</li>
            <li>그룹 내 멤버 식별</li>
          </ul>
          <p className="mt-2 text-gray-400">수집된 정보는 서비스 제공 외 목적으로 사용하지 않습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">3. 정보 공개 범위</h2>
          <p>사용자명과 캐릭터 정보는 같은 그룹에 속한 멤버에게만 공개됩니다. 제3자에게 판매하거나 제공하지 않습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">4. 보관 기간</h2>
          <p>회원 탈퇴 또는 계정 삭제 요청 시 즉시 삭제됩니다. 탈퇴를 원하시면 관리자에게 문의하세요.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">5. 보안</h2>
          <ul className="mt-2 space-y-1 list-disc list-inside text-gray-400">
            <li>모든 통신은 HTTPS로 암호화됩니다</li>
            <li>비밀번호를 직접 저장하지 않으며, Discord가 인증을 담당합니다</li>
            <li>데이터는 Neon (PostgreSQL) 클라우드 DB에 저장됩니다</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-3">6. 운영자 연락처</h2>
          <p className="text-gray-400">개인정보 관련 문의 및 삭제 요청은 서비스 운영자에게 Discord로 문의하세요.</p>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/login">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
            ← 로그인으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  )
}
