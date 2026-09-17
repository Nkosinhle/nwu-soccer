export default function PerformanceLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-20 bg-white border-b border-slate-100" />

      <div className="p-8">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-8 w-28 bg-slate-100 rounded-full"
            />
          ))}
        </div>

        <div className="h-72 bg-slate-100 rounded-xl mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-100 rounded-xl" />
          <div className="h-96 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}