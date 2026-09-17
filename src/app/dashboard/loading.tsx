export default function DashboardLoading() {
  return (
    <div className="animate-fade-in">
      <div className="p-8">
        <div className="mb-6">
          <div className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 h-72 rounded-2xl bg-slate-200 animate-pulse" />

          <div className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-64 rounded-2xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  )
}