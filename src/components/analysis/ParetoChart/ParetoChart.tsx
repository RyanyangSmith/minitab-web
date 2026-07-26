import React, { useState, useMemo } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { columnName } from '../../../utils/columnName';
import { ChartContainer } from '../../common/ChartContainer';
import type { EChartsOption } from 'echarts';

interface ParetoChartProps {
  tableId: string;
  resultId: string;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({ tableId, resultId }) => {
  const tables = useTableStore((s) => s.tables);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getCellValue = useTableStore((s) => s.getCellValue);

  const table = tables[tableId];
  const [defectCol, setDefectCol] = useState<number | null>(null);
  const [freqCol, setFreqCol] = useState<number | null>(null);

  const options = useMemo(() => {
    if (!table) return [];
    return Array.from({ length: table.columns }, (_, i) => {
      const sub = getSubHeader(tableId, i);
      const label = sub ? `${columnName(i)} - ${sub}` : columnName(i);
      return { value: i, label };
    });
  }, [table, tableId, getSubHeader]);

  const chartOption: EChartsOption | null = useMemo(() => {
    if (defectCol == null || !table) return null;

    // Collect data
    const categoryMap: Record<string, number> = {};

    for (let r = 2; r < table.rows; r++) {
      const cat = getCellValue(tableId, r, defectCol);
      if (cat == null || cat === '') continue;
      const catStr = String(cat);

      if (freqCol != null) {
        const fv = getCellValue(tableId, r, freqCol);
        const fn = fv == null ? 0 : Number(fv);
        if (!isNaN(fn)) {
          categoryMap[catStr] = (categoryMap[catStr] || 0) + fn;
        }
      } else {
        categoryMap[catStr] = (categoryMap[catStr] || 0) + 1;
      }
    }

    // Sort descending by frequency
    const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;

    const categories = sorted.map(([c]) => c);
    const frequencies = sorted.map(([, f]) => f);
    const total = frequencies.reduce((a, b) => a + b, 0);
    let cumSum = 0;
    const cumPct = frequencies.map((f) => {
      cumSum += f;
      return total > 0 ? (cumSum / total) * 100 : 0;
    });

    return {
      title: { text: '帕累托图', left: 'center', textStyle: { fontSize: 13 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      xAxis: { type: 'category', data: categories, name: '类别' },
      yAxis: [
        { type: 'value', name: '频次' },
        { type: 'value', name: '累积百分比 (%)', max: 100, axisLabel: { formatter: '{value}%' } },
      ],
      series: [
        {
          type: 'bar',
          data: frequencies,
          name: '频次',
          color: '#3b82f6',
          yAxisIndex: 0,
        },
        {
          type: 'line',
          data: cumPct,
          name: '累积百分比',
          color: '#ef4444',
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { width: 2 },
        },
      ],
    };
  }, [defectCol, freqCol, table, tableId, getCellValue]);

  if (!table) return <div className="p-4 text-gray-500">工作表不存在</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">帕累托图 - 配置</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 w-[100px]">缺陷类别列</label>
          <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={defectCol ?? ''} onChange={(e) => setDefectCol(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">请选择...</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label className="text-sm font-medium text-gray-600 w-[100px] ml-3">频数列（可选）</label>
          <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={freqCol ?? ''} onChange={(e) => setFreqCol(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">自动计数</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {chartOption && <ChartContainer option={chartOption} height={400} />}
    </div>
  );
};
