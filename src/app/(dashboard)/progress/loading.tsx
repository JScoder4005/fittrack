import { SkeletonStatCards, SkeletonChart } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-48 mt-1" />
      </div>
      <SkeletonStatCards count={3} />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SkeletonChart />
        </div>
        <SkeletonChart />
      </div>
    </div>
  );
}
