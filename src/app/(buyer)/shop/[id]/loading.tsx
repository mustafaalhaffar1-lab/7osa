export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="skeleton aspect-square rounded-3xl" />
        <div>
          <div className="skeleton h-4 w-24" />
          <div className="skeleton mt-2 h-8 w-3/4" />
          <div className="skeleton mt-5 h-10 w-40" />
          <div className="mt-4 flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-7 w-28 rounded-full" />
            ))}
          </div>
          <div className="skeleton mt-6 h-12 w-full rounded-full sm:w-64" />
        </div>
      </div>
    </div>
  );
}
