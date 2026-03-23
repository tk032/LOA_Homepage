import Link from "next/link"
import { LayoutDashboard, Users } from "lucide-react"

interface SidebarGroup {
  id: string
  name: string
}

interface AppSidebarProps {
  groups: SidebarGroup[]
  currentPath?: string
}

export function AppSidebar({ groups }: AppSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-44 shrink-0 border-r border-gray-800 bg-gray-950 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4">
      <nav className="flex flex-col gap-0.5 px-2">
        <SidebarLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="대시보드" />
        <SidebarLink href="/groups" icon={<Users className="h-4 w-4" />} label="그룹 목록" />

        {groups.length > 0 && (
          <>
            <p className="mt-3 mb-1 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              내 그룹
            </p>
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${encodeURIComponent(g.name)}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors truncate"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
                <span className="truncate">{g.name}</span>
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
    >
      <span className="shrink-0 text-gray-500">{icon}</span>
      {label}
    </Link>
  )
}
