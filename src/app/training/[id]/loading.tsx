export default function TrainingDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-20 bg-white border-b border-slate-100" />

      <div className="p-8">
        <div className="h-5 w-36 bg-slate-100 rounded mb-6" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-20 bg-slate-100 rounded-xl"
            />
          ))}
        </div>

        <div className="h-28 bg-slate-100 rounded-xl mb-6" />

        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-16 bg-slate-100 rounded-xl"
            />
          ))}
        </div>
      </div>
    </div>
  )
}