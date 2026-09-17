export default function TeamsLoading() {
  return (
    <div className="animate-fade-in">
      <div className="p-8">
        <div className="flex justify-between mb-6">
          <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />

          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 bg-slate-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  )
}