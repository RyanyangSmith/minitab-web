import React, { useState, useMemo } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { normalityTest } from '../../../stats/normality';
import { columnName } from '../../../utils/columnName';
import { ChartContainer } from '../../common/ChartContainer';
import { StatisticalTable } from '../../common/StatisticalTable';
import type { EChartsOption } from 'echarts';

interface NormalityTestProps {
  tableId: string;
  resultId: string;
}

export const NormalityTest: React.FC<NormalityTestProps> = ({ tableId, resultId }) => {
  const tables = useTableStore((s) => s.tables);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getColumnData = useTableStore((s) => s.getColumnData);
  const updateResult = useAnalysisStore((s) => s.addResult);

  const table = tables[tableId];
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [resultData, setResultData] = useState<ReturnType<typeof normalityTest> | null>(null);

  const options = useMemo(() => {
    if (!table) return [];
    return Array.from({ length: table.columns }, (_, i) => {
      const sub = getSubHeader(tableId, i);
      const label = sub ? `${columnName(i)} - ${sub}` : columnName(i);
      return { value: i, label };
    });
  }, [table, tableId, getSubHeader]);

  const handleRun = () => {
    if (selectedCol == null) return;
    const data = getColumnData(tableId, selectedCol);
    if (data.length === 0) return;
    const result = normalityTest(data);
    setResultData(result);

    updateResult(tableId, 'normality-test', { col: selectedCol }, { col: selectedCol, result });
  };

  const histogramOption: EChartsOption | null = useMemo(() => {
    if (!resultData) return null;
    const data = getColumnData(tableId, selectedCol!);
    if (data.length === 0) return null;

    const bins = Math.min(20, Math.ceil(Math.sqrt(data.length)));
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins || 1;
    const histData: number[] = new Array(bins).fill(0);
    const binLabels: string[] = [];

    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      binLabels.push(binStart.toFixed(2));
    }

    for (const val of data) {
      const idx = Math.min(bins - 1, Math.floor((val - min) / binWidth));
      histData[idx]++;
    }

    // Normal curve
    const curveX: number[] = [];
    const curveY: number[] = [];
    const step = (max - min) / 100;
    for (let x = min - binWidth; x <= max + binWidth; x += step) {
      curveX.push(x);
      const z = (x - resultData.mean) / resultData.stddev;
      curveY.push(
        (data.length * binWidth / (resultData.stddev * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * z * z)
      );
    }

    return {
      title: { text: '直方图（含正态拟合曲线）', left: 'center', textStyle: { fontSize: 13 } },
      xAxis: { type: 'category', data: binLabels, name: '区间' },
      yAxis: { type: 'value', name: '频次' },
      series: [
        { type: 'bar', data: histData, name: '频次', color: '#3b82f6' },
        { type: 'line', data: curveY, name: '正态拟合', smooth: true, color: '#ef4444', lineStyle: { width: 2 } },
      ],
    };
  }, [resultData, selectedCol, tableId, getColumnData]);

  const qqOption: EChartsOption | null = useMemo(() => {
    if (!resultData) return null;
    const data = getColumnData(tableId, selectedCol!);
    if (data.length === 0) return null;

    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    const theoretical: number[] = [];
    const observed: number[] = [];

    for (let i = 0; i < n; i++) {
      const p = (i + 0.5) / n;
      // Approximate normal quantile
      const t = Math.sqrt(-2 * Math.log(Math.min(p, 1 - p)));
      const sign = p < 0.5 ? -1 : 1;
      const q = sign * (t - (2.515517 + 0.802853 * t + 0.010328 * t * t) /
        (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t));
      theoretical.push(q * resultData.stddev + resultData.mean);
      observed.push(sorted[i]);
    }

    return {
      title: { text: '正态概率图 (Q-Q Plot)', left: 'center', textStyle: { fontSize: 13 } },
      xAxis: { type: 'value', name: '理论分位数' },
      yAxis: { type: 'value', name: '实际值' },
      series: [
        {
          type: 'scatter',
          data: theoretical.map((t, i) => [t, observed[i]]),
          name: '数据点',
          symbolSize: 4,
        },
        {
          type: 'line',
          data: [[Math.min(...observed), Math.min(...observed)], [Math.max(...observed), Math.max(...observed)]],
          name: '参考线',
          lineStyle: { color: '#ef4444', type: 'dashed', width: 1 },
          symbol: 'none',
        },
      ],
    };
  }, [resultData, selectedCol, tableId, getColumnData]);

  if (!table) return <div className="p-4 text-gray-500">工作表不存在</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">正态检验 - 配置</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap min-w-[80px]">
            选择数据列
          </label>
          <select
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white focus:border-blue-400 outline-none"
            value={selectedCol == null ? '' : selectedCol}
            onChange={(e) => setSelectedCol(e.target.value === '' ? null : Number(e.target.value))}
          >
            <option value="">请选择列...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleRun}
            disabled={selectedCol == null}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            执行分析
          </button>
        </div>
      </div>

      {resultData && (
        <div className="space-y-4">
          <StatisticalTable
            title="正态检验结果"
            columns={[
              { key: 'test', label: '检验方法' },
              { key: 'statistic', label: '统计量' },
              { key: 'pValue', label: 'P 值' },
            ]}
            data={[
              { test: 'Anderson-Darling', statistic: resultData.ad.statistic, pValue: resultData.ad.pValue },
              { test: 'Shapiro-Wilk', statistic: resultData.sw.statistic, pValue: resultData.sw.pValue },
              { test: 'Kolmogorov-Smirnov', statistic: resultData.ks.statistic, pValue: resultData.ks.pValue },
            ]}
          />

          <StatisticalTable
            title="描述统计"
            columns={[
              { key: 'label', label: '统计量' },
              { key: 'value', label: '值' },
            ]}
            data={[
              { label: '样本量 (N)', value: resultData.n },
              { label: '均值', value: resultData.mean },
              { label: '标准差', value: resultData.stddev },
            ]}
          />

          {histogramOption && <ChartContainer option={histogramOption} height={350} />}
          {qqOption && <ChartContainer option={qqOption} height={350} />}
        </div>
      )}
    </div>
  );
};
