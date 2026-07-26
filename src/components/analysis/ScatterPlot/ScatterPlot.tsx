import React, { useState, useMemo } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { columnName } from '../../../utils/columnName';
import { ChartContainer } from '../../common/ChartContainer';
import type { EChartsOption } from 'echarts';

interface ScatterPlotProps {
  tableId: string;
  resultId: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const ScatterPlot: React.FC<ScatterPlotProps> = ({ tableId, resultId }) => {
  const tables = useTableStore((s) => s.tables);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getCellValue = useTableStore((s) => s.getCellValue);

  const table = tables[tableId];
  const [xCol, setXCol] = useState<number | null>(null);
  const [yCol, setYCol] = useState<number | null>(null);
  const [groupCol, setGroupCol] = useState<number | null>(null);

  const options = useMemo(() => {
    if (!table) return [];
    return Array.from({ length: table.columns }, (_, i) => {
      const sub = getSubHeader(tableId, i);
      const label = sub ? `${columnName(i)} - ${sub}` : columnName(i);
      return { value: i, label };
    });
  }, [table, tableId, getSubHeader]);

  const chartOption: EChartsOption | null = useMemo(() => {
    if (xCol == null || yCol == null || !table) return null;

    const rows = table.rows - 2;
    const pairs: { x: number; y: number; group: string }[] = [];

    for (let r = 2; r < table.rows; r++) {
      const xv = getCellValue(tableId, r, xCol);
      const yv = getCellValue(tableId, r, yCol);
      if (xv != null && yv != null && xv !== '' && yv !== '') {
        const xn = Number(xv);
        const yn = Number(yv);
        if (!isNaN(xn) && !isNaN(yn)) {
          let group = '';
          if (groupCol != null) {
            const gv = getCellValue(tableId, r, groupCol);
            group = gv == null ? '' : String(gv);
          }
          pairs.push({ x: xn, y: yn, group });
        }
      }
    }

    const groups = [...new Set(pairs.map((p) => p.group))];
    const series: EChartsOption['series'] = groups.map((g, i) => {
      const data = pairs.filter((p) => p.group === g);
      return {
        type: 'scatter',
        name: g || '数据点',
        data: data.map((d) => [d.x, d.y]),
        symbolSize: 6,
        color: COLORS[i % COLORS.length],
      };
    });

    if (series.length === 0) {
      series.push({
        type: 'scatter',
        name: '数据点',
        data: pairs.map((d) => [d.x, d.y]),
        symbolSize: 6,
      });
    }

    return {
      title: { text: '散点图', left: 'center', textStyle: { fontSize: 13 } },
      xAxis: { type: 'value', name: columnName(xCol) },
      yAxis: { type: 'value', name: columnName(yCol) },
      series,
    };
  }, [xCol, yCol, groupCol, table, tableId, getCellValue]);

  if (!table) return <div className="p-4 text-gray-500">工作表不存在</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">散点图 - 配置</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 w-[80px]">X 列</label>
          <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={xCol ?? ''} onChange={(e) => setXCol(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">请选择...</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">Y 列</label>
          <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={yCol ?? ''} onChange={(e) => setYCol(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">请选择...</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">分组列</label>
          <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={groupCol ?? ''} onChange={(e) => setGroupCol(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">无</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {chartOption && <ChartContainer option={chartOption} height={400} />}
    </div>
  );
};
