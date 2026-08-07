import React, { useState, useMemo } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { columnName } from '../../../utils/columnName';
import { computeAxisRange } from '../../../utils/axisRange';
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

  // Stats data for the table below
  const statsData = useMemo(() => {
    if (selectedCols.length === 0) return [];
    return selectedCols.map((col) => {
      const data = getColumnData(tableId, col);
      const s = descriptiveStats(data);
      return {
        name: getSubHeader(tableId, col) || columnName(col),
        n: s.n, min: s.min, max: s.max, mean: s.mean, median: s.median, q1: s.q1, q3: s.q3, stddev: s.stddev,
      };
    });
  }, [selectedCols, tableId, getColumnData, getSubHeader]);

  const chartOption: EChartsOption | null = useMemo(() => {
    if (selectedCols.length === 0) return null;
    const boxData: number[][] = [];
    const labels: string[] = [];
    for (const col of selectedCols) {
      const data = getColumnData(tableId, col);
      if (data.length === 0) continue;
      const stats = descriptiveStats(data);
      boxData.push([stats.min, stats.q1, stats.median, stats.q3, stats.max]);
      labels.push(getSubHeader(tableId, col) || columnName(col));
    }
    if (boxData.length === 0) return null;
    const allValues = selectedCols.flatMap((col) => getColumnData(tableId, col));
    const yRange = computeAxisRange(allValues);
    return {
      title: { text: '箱线图', left: 'center', textStyle: { fontSize: 13 } },
      xAxis: { type: 'category' as const, data: labels },
      yAxis: {
        type: 'value' as const,
        name: '数值',
        scale: true,
        min: yRange.min,
        max: yRange.max,
      },
      series: [{
        type: 'boxplot' as const,
        data: boxData,
        itemStyle: {
          color: '#3b82f6',
          borderColor: '#1d4ed8',
          borderWidth: 1.5,
        },
        boxWidth: [20, 40],
      }],
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

      {chartOption && <ChartContainer option={chartOption} height={350} />}

      {statsData.length > 0 && (
        <div className="text-xs">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-1 border border-gray-200 text-left">组名</th>
                <th className="px-2 py-1 border border-gray-200 text-right">N</th>
                <th className="px-2 py-1 border border-gray-200 text-right">Min</th>
                <th className="px-2 py-1 border border-gray-200 text-right">Q1</th>
                <th className="px-2 py-1 border border-gray-200 text-right">中位数</th>
                <th className="px-2 py-1 border border-gray-200 text-right">均值</th>
                <th className="px-2 py-1 border border-gray-200 text-right">Q3</th>
                <th className="px-2 py-1 border border-gray-200 text-right">Max</th>
                <th className="px-2 py-1 border border-gray-200 text-right">标准差</th>
              </tr>
            </thead>
            <tbody>
              {statsData.map((s) => (
                <tr key={s.name} className="border-b border-gray-100 hover:bg-blue-50">
                  <td className="px-2 py-1 border border-gray-200 font-medium">{s.name}</td>
                  <td className="px-2 py-1 border border-gray-200 text-right font-mono">{s.n}</td>
                  <td className="px-2 py-1 border border-gray-200 text-right font-mono">{s.min.toFixed(2)}</td>
                  <td className="px-2 py-1 border border-gray-200 text-right font-mono">{s.q1.toFixed(2)}</td>
                  <td className="px-2 py-1 border border-gray-200 text-right font-mono font-semibold text-blue-700">{s.median.toFixed(2)}</td>
                  <td className="px-2 py-1 border border-gray-200 text-right font-mono">{s.mean.toFixed(2)}</td>
                  <td className="px-2 py-1 border border-gray-200 text-right font-mono">{s.q3.toFixed(2)}</td>
                  <td className="px-2 py-1 border border-gray-200 text-right font-mono">{s.max.toFixed(2)}</td>
                  <td className="px-2 py-1 border border-gray-200 text-right font-mono">{s.stddev.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
