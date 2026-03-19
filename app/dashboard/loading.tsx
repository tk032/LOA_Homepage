export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="h-6 w-24 bg-gray-800 rounded animate-pulse" />
      </div>
      {/* Gold summary skeleton */}
      <div className="h-40 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
      {/* Character grid skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-24 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
