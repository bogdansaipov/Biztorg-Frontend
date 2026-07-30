// Mirrors FavoriteProductCard's structure exactly (same p-2 wrapper, same
// aspect-square footprint, same text block heights) so the loading state
// doesn't jump/shift once real cards swap in.
export default function FavoriteCardSkeleton() {
  return (
    <div className="rounded-xl p-2 animate-pulse">
      <div className="aspect-square rounded-2xl bg-gray-200" />
      <div className="mt-3 h-[21px] w-3/4 rounded bg-gray-200 mb-1.5" />
      <div className="h-[18px] w-full rounded bg-gray-200 mb-1" />
      <div className="h-[18px] w-2/3 rounded bg-gray-200 mb-[5px]" />
      <div className="h-[16px] w-1/2 rounded bg-gray-200 mb-1" />
      <div className="h-[16px] w-1/3 rounded bg-gray-200" />
    </div>
  );
}