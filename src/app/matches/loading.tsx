export default function MatchesLoading() {
  return (
    <div className="animate-fade-in">
      <div className="p-4 md:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-2xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>

        <div className="flex gap-2 mb-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-8 w-20 rounded-full bg-slate-200 animate-pulse"
            />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-2xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  )
}