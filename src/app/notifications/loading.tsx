export default function NotificationsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-20 bg-white border-b border-slate-100" />

      <div className="p-8">
        <div className="flex gap-2 mb-5">
          <div className="h-9 w-20 bg-slate-200 rounded-full" />
          <div className="h-9 w-28 bg-slate-200 rounded-full" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(
            (item) => (
              <div
                key={item}
                className="h-24 bg-slate-200 rounded-xl"
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}