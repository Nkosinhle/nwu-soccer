export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="p-8">

        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />

          <div className="h-4 w-64 bg-slate-200 rounded mt-2 animate-pulse" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="flex gap-3 mb-8">
          <div className="h-11 flex-1 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-11 w-44 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-11 w-44 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="card h-56 animate-pulse"
            >
              <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4" />

              <div className="h-4 bg-slate-200 rounded w-24 mx-auto mb-2" />

              <div className="h-3 bg-slate-200 rounded w-20 mx-auto mb-4" />

              <div className="h-6 bg-slate-200 rounded w-32 mx-auto" />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}