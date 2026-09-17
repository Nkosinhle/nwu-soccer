export default function MedicalLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-20 bg-white border-b border-slate-100" />

      <div className="p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 bg-slate-100 rounded-xl"
            />
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-8 w-24 bg-slate-100 rounded-full"
            />
          ))}
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 bg-slate-100 rounded-xl"
            />
          ))}
        </div>
      </div>
    </div>
  )
}