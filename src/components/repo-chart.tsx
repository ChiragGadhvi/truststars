
'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RepoChartProps {
  data: any[];
  title: string;
  dataKey: string;
  color: string;
}

export function RepoChart({ data, title, dataKey, color }: RepoChartProps) {
  // Format data for chart
  const formattedData = data.map(d => ({
    date: new Date(d.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    stars: d.stars,
    forks: d.forks,
    // Use dynamic key access if needed, or map explicitly
    val: typeof (d as any)[dataKey] === 'number' ? (d as any)[dataKey] : 0
  }))

  return (
    <Card className="col-span-1 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
        <div className="text-2xl font-bold">
           {formattedData.length > 0 ? (formattedData[formattedData.length - 1].val ?? 0).toLocaleString() : 0}
        </div>
      </CardHeader>
      <CardContent className="pl-0 pb-2">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                minTickGap={30}
              />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--popover-foreground))',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              />
              <Area 
                 type="monotone" 
                 dataKey="val" 
                 stroke={color} 
                 fillOpacity={1} 
                 fill={`url(#gradient-${dataKey})`} 
                 strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
