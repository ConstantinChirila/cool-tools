export interface YearlyColumn<Row> {
  label: string;
  value: (row: Row) => string;
}

/** Scrolling year-by-year breakdown: a "Year" column, then one right-aligned column per entry. */
export function YearlyTable<Row extends { year: number }>({
  rows,
  columns,
}: {
  rows: readonly Row[];
  columns: readonly YearlyColumn<Row>[];
}) {
  return (
    <div className="max-h-96 overflow-y-auto rounded-2xl border-2 border-foreground">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b border-foreground/15 text-left text-xs font-bold text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Year</th>
            {columns.map((col) => (
              <th key={col.label} className="px-4 py-2.5 text-right font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-numeric">
          {rows.map((row) => (
            <tr key={row.year} className="border-b border-foreground/10 last:border-0 hover:bg-secondary">
              <td className="px-4 py-2.5 text-muted-foreground">{row.year}</td>
              {columns.map((col) => (
                <td key={col.label} className="px-4 py-2.5 text-right">
                  {col.value(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
