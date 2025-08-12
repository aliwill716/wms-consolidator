"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import type { AnalysisResults } from "@/lib/space-analysis"
import { BarChart3, TrendingUp, Package, AlertTriangle, Eye, PieChartIcon } from "lucide-react"

interface AnalysisDashboardProps {
  results: AnalysisResults
}

export function AnalysisDashboard({ results }: AnalysisDashboardProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num))
  }

  const formatPercent = (num: number) => {
    return `${Math.round(num)}%`
  }

  // Prepare chart data
  const utilizationChartData = Object.entries(results.utilizationByType).map(([type, data]) => ({
    type,
    utilized: Math.round(data.totalUsed),
    wasted: Math.round(data.wastedSpace),
    utilizationPercent: Math.round(data.averageUtilization),
  }))

  const pieChartData = utilizationChartData.map((item) => ({
    name: item.type,
    value: item.utilized,
    waste: item.wasted,
  }))

  const locationDetailData = results.locationAnalysis
    .sort((a, b) => b.currentUtilization.utilizationPercent - a.currentUtilization.utilizationPercent)
    .slice(0, 10)
    .map((location) => ({
      name: location.location_name,
      type: location.type,
      utilization: Math.round(location.currentUtilization.utilizationPercent),
      used: Math.round(location.currentUtilization.volume),
      wasted: Math.round(location.wastedSpace.volume),
    }))

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="album-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-copper-mid via-copper-light to-copper-accent"></div>
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-copper-mid opacity-80" />
            <h3 className="font-medium text-deep-teal">Total Locations</h3>
          </div>
          <p className="text-3xl font-bold text-deep-teal">{results.totalLocations}</p>
        </Card>

        <Card className="album-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-copper-mid via-copper-light to-copper-accent"></div>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-copper-mid opacity-80" />
            <h3 className="font-medium text-deep-teal">Wasted Space</h3>
          </div>
          <p className="text-3xl font-bold text-deep-teal">{formatNumber(results.totalWastedSpace)}</p>
          <p className="text-sm text-muted-ink">cubic inches</p>
        </Card>

        <Card className="album-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-copper-mid via-copper-light to-copper-accent"></div>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-copper-mid opacity-80" />
            <h3 className="font-medium text-deep-teal">Potential Savings</h3>
          </div>
          <p className="text-3xl font-bold text-deep-teal">{formatNumber(results.totalPotentialSavings)}</p>
          <p className="text-sm text-muted-ink">cubic inches</p>
        </Card>

        <Card className="album-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-copper-mid via-copper-light to-copper-accent"></div>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-copper-mid opacity-80" />
            <h3 className="font-medium text-deep-teal">Opportunities</h3>
          </div>
          <p className="text-3xl font-bold text-deep-teal">{results.consolidationOpportunities.length}</p>
          <p className="text-sm text-muted-ink">consolidations</p>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-deep-teal">
            <Eye className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="utilization" className="flex items-center gap-2 text-deep-teal">
            <BarChart3 className="w-4 h-4" />
            Utilization
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2 text-deep-teal">
            <PieChartIcon className="w-4 h-4" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2 text-deep-teal">
            <Package className="w-4 h-4" />
            Locations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Utilization by Type */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-deep-teal mb-6">Utilization by Location Type</h3>
            <div className="space-y-6">
              {Object.entries(results.utilizationByType).map(([type, data]) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-deep-teal">{type}</h4>
                      <Badge
                        variant={
                          data.averageUtilization > 80
                            ? "destructive"
                            : data.averageUtilization > 60
                              ? "default"
                              : "secondary"
                        }
                      >
                        {formatPercent(data.averageUtilization)} utilized
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-ink">
                      {formatNumber(data.totalUsed)} / {formatNumber(data.totalCapacity)}
                    </div>
                  </div>
                  <Progress value={data.averageUtilization} className="h-3" />
                  <div className="flex justify-between text-sm text-muted-ink">
                    <span>Used: {formatNumber(data.totalUsed)}</span>
                    <span>Wasted: {formatNumber(data.wastedSpace)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Underutilized Locations */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-deep-teal mb-6">Most Underutilized Locations</h3>
            <div className="space-y-4">
              {results.locationAnalysis
                .filter((loc) => loc.currentUtilization.utilizationPercent < 50)
                .sort((a, b) => a.currentUtilization.utilizationPercent - b.currentUtilization.utilizationPercent)
                .slice(0, 5)
                .map((location) => (
                  <Card key={location.location_name} className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-medium text-deep-teal">{location.location_name}</h4>
                      <p className="text-sm text-muted-ink">
                        {location.type} • {location.products.length} products
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {formatPercent(location.currentUtilization.utilizationPercent)} used
                      </Badge>
                      <p className="text-sm text-muted-ink mt-1">{formatNumber(location.wastedSpace.volume)} wasted</p>
                    </div>
                  </Card>
                ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-deep-teal mb-6">Space Utilization by Location Type</h3>
            <ChartContainer
              config={{
                utilized: {
                  label: "Utilized Space",
                  color: "#3b82f6",
                },
                wasted: {
                  label: "Wasted Space",
                  color: "#ef4444",
                },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fill: "#0F3D3A" }} />
                  <YAxis tick={{ fill: "#0F3D3A" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="utilized" fill="#3b82f6" name="Utilized Space" />
                  <Bar dataKey="wasted" fill="#ef4444" name="Wasted Space" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold text-deep-teal mb-6">Utilization Percentage by Type</h3>
            <ChartContainer
              config={{
                utilizationPercent: {
                  label: "Utilization %",
                  color: "#10b981",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={utilizationChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fill: "#0F3D3A" }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#0F3D3A" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="utilizationPercent"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                    name="Utilization %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-deep-teal mb-6">Space Distribution by Type</h3>
              <ChartContainer
                config={{
                  value: {
                    label: "Used Space",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-deep-teal mb-6">Waste Distribution by Type</h3>
              <ChartContainer
                config={{
                  waste: {
                    label: "Wasted Space",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#ef4444"
                      dataKey="waste"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-deep-teal mb-6">Top 10 Locations by Utilization</h3>
            <ChartContainer
              config={{
                utilization: {
                  label: "Utilization %",
                  color: "#3b82f6",
                },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={locationDetailData}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#0F3D3A" }} />
                  <YAxis dataKey="name" type="category" width={50} tick={{ fill: "#0F3D3A" }} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [`${value}%`, name === "utilization" ? "Utilization" : name]}
                  />
                  <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold text-deep-teal mb-6">Location Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-soft">
                    <th className="text-left py-3 px-4 font-medium text-deep-teal">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-deep-teal">Type</th>
                    <th className="text-right py-3 px-4 font-medium text-deep-teal">Utilization</th>
                    <th className="text-right py-3 px-4 font-medium text-deep-teal">Used Space</th>
                    <th className="text-right py-3 px-4 font-medium text-deep-teal">Wasted Space</th>
                  </tr>
                </thead>
                <tbody>
                  {locationDetailData.map((location) => (
                    <tr key={location.name} className="border-b border-border-soft hover:bg-seafoam-light/10">
                      <td className="py-3 px-4 font-medium text-deep-teal">{location.name}</td>
                      <td className="py-3 px-4 text-muted-ink">{location.type}</td>
                      <td className="py-3 px-4 text-right">
                        <Badge
                          variant={
                            location.utilization > 80
                              ? "destructive"
                              : location.utilization > 60
                                ? "default"
                                : "secondary"
                          }
                        >
                          {location.utilization}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-ink">{formatNumber(location.used)}</td>
                      <td className="py-3 px-4 text-right text-muted-ink">{formatNumber(location.wasted)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
