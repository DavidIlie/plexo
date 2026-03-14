import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

interface StatCardProps {
   icon: LucideIcon;
   label: string;
   value: string | number;
}

export const StatCard: React.FC<StatCardProps> = ({
   icon: Icon,
   label,
   value,
}) => {
   return (
      <Card>
         <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3">
               <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
               <p className="text-2xl font-bold">{value}</p>
               <p className="text-sm text-muted-foreground">{label}</p>
            </div>
         </CardContent>
      </Card>
   );
};
