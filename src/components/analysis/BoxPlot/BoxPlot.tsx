import React, { useState, useMemo } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { columnName } from '../../../utils/columnName';
import { descriptiveStats } from '../../../stats/descriptive';
import { ChartContainer } from '../../common/ChartContainer';
import type { EChartsOption } from 'echarts';

interface BoxPlotProps { tableId: string; resultId: string; }

export const BoxPlotView: React.FC<BoxPlotProps> = ({ tableId, resultId }) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getColumnData = useTableStore((s) => s.getColumnData);
  const results = useAnalysisStore((s) => s.results);
  const updateResultData = useAnalysisStore((s) => s.updateResultData);

  const saved = results[resultId];
  const savedConfig = saved?.config as { cols?: number[] } | undefined;

  const [selectedCols, setSelectedCols] = useState<number[]>(savedConfig?.cols ?? []);

  const options = useMemo(() => {
    if (!table) return [];
    return Array.from({ length: table.columns }, (_, i) => {
      const sub = getSubHeader(tableId, i);
      return { value: i, label: sub ? `${columnName(i)} - ${sub}` : columnName(i) };
    });
  }, [table, tableId, getSubHeader]);

  const toggleCol = (col: number) => {
    setSelectedCols((prev) => {
      const next = prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col];
      updateResultData(resultId, { cols: next }, {});
      return next;
    });
  };

  const chartOption: EChartsOption | null = useMemo(() => {
    if (selectedCols.length === 0) return null;
    const series = selectedCols.map((col) => {
      const data = getColumnData(tableId, col);
      const stats = descriptiveStats(data);
      const iqr = stats.q3 - stats.q1;
      const lower = stats.q1 - 1.5 * iqr;
      const upper = stats.q3 + 1.5 * iqr;
      const innerData = data.filter((v) => v >= lower && v <= upper);
      const whiskerMin = innerData.length > 0 ? Math.min(...innerData) : stats.q1;
      const whiskerMax = innerData.length > 0 ? Math.max(...innerData) : stats.q3;
      const label = getSubHeader(tableId, col) || columnName(col);
      return { type: 'boxplot' as const, name: label, data: [[whiskerMin, stats.q1, stats.median, stats.q3, whiskerMax]], itemStyle: { color: '#3b82f6' } };
    });
    return {
      title: { text: '箱线图', left: 'center', textStyle: { fontSize: 13 } },
      xAxis: { type: 'category' as const, data: selectedCols.map((c) => getSubHeader(tableId, c) || columnName(c)) },
      yAxis: { type: 'value' as const, name: '数值' },
      series,
      tooltip: { trigger: 'item' as const },
    };
  }, [selectedCols, tableId, getColumnData, getSubHeader]);

  if (!table) return <div className="p-4 text-gray-500">工作表不存在</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">箱线图 - 选择列</h3>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={selectedCols.includes(opt.value)} onChange={() => toggleCol(opt.value)} className="rounded border-gray-300" />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
      {chartOption && <ChartContainer option={chartOption} height={400} />}
    </div>
  );
};