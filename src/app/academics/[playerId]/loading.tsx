export default function PlayerAcademicsLoading() {
  return (
    <div className="animate-pulse min-h-screen bg-gray-50">
      <div className="h-40 bg-slate-200" />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="h-6 w-52 bg-slate-200 rounded mb-4" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-40 bg-slate-200 rounded-xl"
                />
              )
            )}
          </div>
        </div>

        <div>
          <div className="h-6 w-64 bg-slate-200 rounded mb-4" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}