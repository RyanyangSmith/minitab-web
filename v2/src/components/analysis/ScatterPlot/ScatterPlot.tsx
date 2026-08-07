import React, { useState, useMemo } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { columnName } from '../../../utils/columnName';
import { computeAxisRange } from '../../../utils/axisRange';
import { ChartContainer } from '../../common/ChartContainer';
import type { EChartsOption } from 'echarts';

const COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16'];

const integerAxisLabel = {
  showMinLabel: false,
  showMaxLabel: false,
  formatter: (value: number) => String(Math.round(value)),
};

interface ScatterPlotProps { tableId: string; resultId: string; }

export const ScatterPlot: React.FC<ScatterPlotProps> = ({ tableId, resultId }) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getColumnPairs = useTableStore((s) => s.getColumnPairs);
  const getCellValue = useTableStore((s) => s.getCellValue);
  const results = useAnalysisStore((s) => s.results);
  const updateResultData = useAnalysisStore((s) => s.updateResultData);

  const saved = results[resultId];
  const savedConfig = saved?.config as { xCol?: number; yCol?: number; groupCol?: number } | undefined;

  const [xCol, setXCol] = useState<number | null>(savedConfig?.xCol ?? null);
  const [yCol, setYCol] = useState<number | null>(savedConfig?.yCol ?? null);
  const [groupCol, setGroupCol] = useState<number | null>(savedConfig?.groupCol ?? null);

  const options = useMemo(() => {
    if (!table) return [];
    return Array.from({ length: table.columns }, (_, i) => {
      const sub = getSubHeader(tableId, i);
      return { value: i, label: sub ? `${columnName(i)} - ${sub}` : columnName(i) };
    });
  }, [table, tableId, getSubHeader]);

  const saveConfig = (x: number | null, y: number | null, g: number | null) => {
    updateResultData(resultId, { xCol: x, yCol: y, groupCol: g }, {});
  };

  const chartOption: EChartsOption | null = useMemo(() => {
    if (xCol == null || yCol == null || !table) return null;
    const pairs = getColumnPairs(tableId, xCol, yCol).map((p) => {
      let group = '';
      if (groupCol != null) {
        const gv = getCellValue(tableId, p.row, groupCol);
        group = gv == null ? '' : String(gv);
      }
      return { x: p.a, y: p.b, group };
    });
    const groups = [...new Set(pairs.map((p) => p.group))];
    if (pairs.length === 0) return null;
    const xRange = computeAxisRange(pairs.map((p) => p.x));
    const yRange = computeAxisRange(pairs.map((p) => p.y));
    const series: EChartsOption['series'] = groups.length > 0
      ? groups.map((g, i) => ({ type: 'scatter' as const, name: g || '数据点', data: pairs.filter((p) => p.group === g).map((d) => [d.x, d.y]), symbolSize: 6, color: COLORS[i % COLORS.length] }))
      : [{ type: 'scatter' as const, name: '数据点', data: pairs.map((d) => [d.x, d.y]), symbolSize: 6 }];
    return {
      title: { text: '散点图', left: 'center', textStyle: { fontSize: 13 } },
      xAxis: {
        type: 'value' as const,
        name: columnName(xCol),
        scale: true,
        min: xRange.min,
        max: xRange.max,
        minInterval: 1,
        axisLabel: integerAxisLabel,
      },
      yAxis: {
        type: 'value' as const,
        name: columnName(yCol),
        scale: true,
        min: yRange.min,
        max: yRange.max,
        minInterval: 1,
        axisLabel: integerAxisLabel,
      },
      series,
    };
  }, [xCol, yCol, groupCol, table, tableId, getColumnPairs, getCellValue]);

  if (!table) return <div className="p-4 text-gray-500">工作表不存在</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">散点图 - 配置</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 w-[80px]">X 列</label>
          <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={xCol ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : Number(e.target.value); setXCol(v); saveConfig(v, yCol, groupCol); }}>
            <option value="">请选择...</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">Y 列</label>
          <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={yCol ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : Number(e.target.value); setYCol(v); saveConfig(xCol, v, groupCol); }}>
            <option value="">请选择...</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">分组列</label>
          <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={groupCol ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : Number(e.target.value); setGroupCol(v); saveConfig(xCol, yCol, v); }}>
            <option value="">无</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      {chartOption && <ChartContainer option={chartOption} height={400} />}
    </div>
  );
};
