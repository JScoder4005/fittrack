import { SkeletonStatCards, SkeletonChart } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40 mt-2" />
      </div>
      <SkeletonStatCards count={4} />
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <SkeletonChart />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
