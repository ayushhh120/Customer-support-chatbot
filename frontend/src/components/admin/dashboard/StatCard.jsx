import { cn } from '@/lib/utils';

const StatCard = ({ title, value, icon: Icon, trend, className }) => {
  return (
    <div 
      className={cn(
        "bg-card rounded-xl p-6 border border-border shadow-sm",
        "transition-all duration-300 hover:shadow-md hover:scale-[1.02]",
        "group cursor-default",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs last week</span>
            </div>
          )}
        </div>
        
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
