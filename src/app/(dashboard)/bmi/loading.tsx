import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonStatCards, SkeletonChart } from "@/components/ui/skeleton-card";

export default function BmiLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </div>
      <SkeletonStatCards count={3} />
      <SkeletonChart />
    </div>
  );
}
