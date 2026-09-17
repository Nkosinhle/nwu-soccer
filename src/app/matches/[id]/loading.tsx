export default function MatchDetailLoading() {
  return (
    <div className="animate-fade-in">
      <div className="p-8">
        <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 rounded-2xl bg-slate-200 animate-pulse" />

          <div className="lg:col-span-2 space-y-5">
            <div className="h-80 rounded-2xl bg-slate-200 animate-pulse" />

            <div className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}