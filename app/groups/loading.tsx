export default function GroupsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
