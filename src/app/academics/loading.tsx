export default function AcademicsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-20 bg-white border-b border-slate-100" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-28 bg-slate-100 rounded-xl"
              />
            )
          )}
        </div>

        <div className="h-24 bg-slate-100 rounded-xl mb-6" />

        <div className="h-16 bg-slate-100 rounded-xl mb-4" />

        <div className="h-80 bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}