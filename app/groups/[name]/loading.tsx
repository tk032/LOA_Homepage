export default function GroupDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
      <div className="h-10 w-64 bg-gray-800 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-64 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
