export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="skeleton h-10 w-full max-w-xl" />
      <div className="mt-8 space-y-8">
        {[0, 1, 2].map((row) => (
          <div key={row}>
            <div className="skeleton mb-3 h-6 w-48" />
            <div className="flex gap-4 overflow-hidden">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-44 shrink-0 sm:w-52">
                  <div className="skeleton aspect-square" />
                  <div className="skeleton mt-2 h-4 w-3/4" />
                  <div className="skeleton mt-1.5 h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
