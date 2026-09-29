import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GrowthChart, type GrowthChartProps } from "@/components/charts/growth-chart";
import { YearlyTable, type YearlyColumn } from "@/components/charts/yearly-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** A card with a year-by-year chart and the same years as a table, one tab each. */
export function YearlyChartCard<Row extends { year: number }>({
  title,
  series,
  formatValue,
  formatAxis,
  extraRow,
  rows,
  columns,
}: Pick<GrowthChartProps, "series" | "formatValue" | "formatAxis" | "extraRow"> & {
  title: string;
  rows: readonly Row[];
  columns: readonly YearlyColumn<Row>[];
}) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="table">Yearly breakdown</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <GrowthChart
              series={series}
              xLabel={(i) => (i === 0 ? "Start" : `Year ${i}`)}
              xTick={(i) => (i === 0 ? "0" : `${i}y`)}
              formatValue={formatValue}
              formatAxis={formatAxis}
              extraRow={extraRow}
            />
          </TabsContent>
          <TabsContent value="table">
            <YearlyTable rows={rows} columns={columns} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
