import React, { useState, useMemo } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { linearRegression } from '../../../stats/regression';
import { columnName } from '../../../utils/columnName';
import { ChartContainer } from '../../common/ChartContainer';
import { StatisticalTable } from '../../common/StatisticalTable';
import type { EChartsOption } from 'echarts';

interface LinearRegressionProps { tableId: string; resultId: string; }

export const LinearRegression: React.FC<LinearRegressionProps> = ({ tableId, resultId }) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getColumnData = useTableStore((s) => s.getColumnData);
  const results = useAnalysisStore((s) => s.results);
  const updateResultData = useAnalysisStore((s) => s.updateResultData);

  const saved = results[resultId];
  const savedConfig = saved?.config as { xCol?: number; yCol?: number } | undefined;
  const savedData = saved?.data as { result?: ReturnType<typeof linearRegression> } | undefined;
  const [xCol, setXCol] = useState<number | null>(savedConfig?.xCol ?? null);
  const [yCol, setYCol] = useState<number | null>(savedConfig?.yCol ?? null);
  const [resultData, setResultData] = useState<ReturnType<typeof linearRegression> | null>(savedData?.result ?? null);

  const options = useMemo(() => {
    if (!table) return [];
    return Array.from({ length: table.columns }, (_, i) => {
      const sub = getSubHeader(tableId, i);
      return { value: i, label: sub ? `${columnName(i)} - ${sub}` : columnName(i) };
    });
  }, [table, tableId, getSubHeader]);

  const handleRun = () => {
    if (xCol == null || yCol == null) return;
    const x = getColumnData(tableId, xCol); const y = getColumnData(tableId, yCol);
    if (x.length < 3 || y.length < 3) return;
    const n = Math.min(x.length, y.length);
    const result = linearRegression(x.slice(0, n), y.slice(0, n));
    setResultData(result);
    updateResultData(resultId, { xCol, yCol }, { result } as Record<string, unknown>);
  };

  const scatterFitOption: EChartsOption | null = useMemo(() => {
    if (!resultData || xCol == null || yCol == null) return null;
    const x = getColumnData(tableId, xCol); const y = getColumnData(tableId, yCol);
    const n = Math.min(x.length, y.length); const xs = x.slice(0, n); const ys = y.slice(0, n);
    const xMin = Math.min(...xs); const xMax = Math.max(...xs);
    return {
      title: { text: '散点图 + 拟合线', left: 'center', textStyle: { fontSize: 13 } },
      xAxis: { type: 'value', name: 'X' }, yAxis: { type: 'value', name: 'Y' },
      series: [
        { type: 'scatter', data: xs.map((xi, i) => [xi, ys[i]]), symbolSize: 5 },
        { type: 'line', data: [[xMin, resultData.slope * xMin + resultData.intercept], [xMax, resultData.slope * xMax + resultData.intercept]], lineStyle: { color: '#ef4444', width: 2 }, symbol: 'none' },
      ],
    };
  }, [resultData, xCol, yCol, tableId, getColumnData]);

  const residualFitOption: EChartsOption | null = useMemo(() => {
    if (!resultData) return null;
    return {
      title: { text: '残差 vs 拟合值', left: 'center', textStyle: { fontSize: 13 } },
      xAxis: { type: 'value', name: '拟合值' }, yAxis: { type: 'value', name: '残差' },
      series: [{ type: 'scatter', data: resultData.fitted.map((f, i) => [f, resultData.residuals[i]]), symbolSize: 5 }],
    };
  }, [resultData]);

  const residualQQOption: EChartsOption | null = useMemo(() => {
    if (!resultData) return null;
    const sorted = [...resultData.residuals].sort((a, b) => a - b); const n = sorted.length;
    const theoretical = sorted.map((_, i) => {
      const p = (i + 0.5) / n; const t = Math.sqrt(-2 * Math.log(Math.min(p, 1 - p)));
      const sign = p < 0.5 ? -1 : 1;
      return sign * (t - (2.515517 + 0.802853 * t + 0.010328 * t * t) / (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t));
    });
    return {
      title: { text: '残差正态概率图', left: 'center', textStyle: { fontSize: 13 } },
      xAxis: { type: 'value', name: '理论分位数' }, yAxis: { type: 'value', name: '残差' },
      series: [
        { type: 'scatter', data: theoretical.map((t, i) => [t, sorted[i]]), symbolSize: 4 },
        { type: 'line', data: [[Math.min(...sorted), Math.min(...sorted)], [Math.max(...sorted), Math.max(...sorted)]], lineStyle: { color: '#ef4444', type: 'dashed', width: 1 }, symbol: 'none' },
      ],
    };
  }, [resultData]);

  if (!table) return <div className="p-4 text-gray-500">工作表不存在</div>;

  return (
    <div className="p-4 space-y-3">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">线性回归 - 配置</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 w-[80px]">X 列</label>
          <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={xCol ?? ''} onChange={(e) => setXCol(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">请选择 X 列...</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">Y 列</label>
          <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={yCol ?? ''} onChange={(e) => setYCol(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">请选择 Y 列...</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={handleRun} disabled={xCol == null || yCol == null} className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40">执行分析</button>
        </div>
      </div>

      {resultData && (
        <div className="space-y-3">
          {/* Row 1: Scatter chart (left) + Regression equation (right) */}
          <div className="flex gap-3">
            <div className="flex-1">{scatterFitOption && <ChartContainer option={scatterFitOption} height={320} />}</div>
            <div className="w-64 flex-shrink-0 text-xs">
              <StatisticalTable title="回归方程" columns={[{ key: 'label', label: '项目' }, { key: 'value', label: '值' }]} data={[
                { label: '方程', value: `Y = ${resultData.intercept.toFixed(4)} + ${resultData.slope.toFixed(4)}X` },
                { label: 'R', value: resultData.r }, { label: 'R²', value: resultData.rSquared },
                { label: '调整 R²', value: resultData.adjustedRSquared }, { label: '标准误', value: resultData.standardError },
              ]} />
            </div>
          </div>

          {/* Row 2: ANOVA table (full width) */}
          <StatisticalTable title="方差分析表" columns={[
            { key: 'source', label: '来源' }, { key: 'df', label: '自由度' }, { key: 'ss', label: '平方和' }, { key: 'ms', label: '均方' }, { key: 'fValue', label: 'F 值' }, { key: 'pValue', label: 'P 值' },
          ]} data={resultData.anovaTable} />

          {/* Row 3: Coefficient table (full width) */}
          <StatisticalTable title="系数表" columns={[
            { key: 'term', label: '项' }, { key: 'coefficient', label: '系数' }, { key: 'se', label: '标准误' }, { key: 'tValue', label: 't 值' }, { key: 'pValue', label: 'P 值' },
          ]} data={resultData.coefTable} />

          {/* Row 4: Residual charts (left + right) */}
          <div className="flex gap-3">
            <div className="flex-1">{residualFitOption && <ChartContainer option={residualFitOption} height={250} />}</div>
            <div className="flex-1">{residualQQOption && <ChartContainer option={residualQQOption} height={250} />}</div>
          </div>
        </div>
      )}
    </div>
  );
};