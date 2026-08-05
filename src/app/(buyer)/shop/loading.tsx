export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="skeleton h-7 w-40" />
      <div className="mt-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-9 w-32 rounded-full" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-square" />
            <div className="skeleton mt-2 h-4 w-3/4" />
            <div className="skeleton mt-1.5 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
