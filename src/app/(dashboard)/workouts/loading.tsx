import { SkeletonStatCards, SkeletonTableRows } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function WorkoutsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-20 mt-1" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <SkeletonStatCards count={3} />
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="p-0">
          <SkeletonTableRows rows={6} />
        </CardContent>
      </Card>
    </div>
  );
}
