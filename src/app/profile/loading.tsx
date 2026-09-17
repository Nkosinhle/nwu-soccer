export default function ProfileLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-20 bg-white border-b border-slate-100" />

      <div className="p-8 max-w-2xl">
        <div className="h-28 bg-slate-200 rounded-xl mb-6" />

        <div className="flex gap-2 mb-5">
          <div className="h-10 w-32 bg-slate-200 rounded-lg" />
          <div className="h-10 w-40 bg-slate-200 rounded-lg" />
        </div>

        <div className="h-80 bg-slate-200 rounded-xl" />
      </div>
    </div>
  )
}