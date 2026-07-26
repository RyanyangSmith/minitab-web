import React, { useState, useMemo } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { capabilityAnalysis, type CapabilityResult } from '../../../stats/capability';
import { normalityTest } from '../../../stats/normality';
import { descriptiveStats } from '../../../stats/descriptive';
import { columnName } from '../../../utils/columnName';
import { ChartContainer } from '../../common/ChartContainer';
import type { EChartsOption } from 'echarts';

interface NormalityTestProps { tableId: string; resultId: string; }

export const NormalityTest: React.FC<NormalityTestProps> = ({ tableId, resultId }) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getColumnData = useTableStore((s) => s.getColumnData);
  const results = useAnalysisStore((s) => s.results);
  const updateResultData = useAnalysisStore((s) => s.updateResultData);

  const saved = results[resultId];
  const savedConfig = saved?.config as { col?: number; lsl?: number; usl?: number; target?: number } | undefined;
  const savedData = saved?.data as { result?: CapabilityResult; norm?: object } | undefined;

  const [selectedCol, setSelectedCol] = useState<number | null>(savedConfig?.col ?? null);
  const [lsl, setLsl] = useState<string>(savedConfig?.lsl?.toString() ?? '');
  const [usl, setUsl] = useState<string>(savedConfig?.usl?.toString() ?? '');
  const [target, setTarget] = useState<string>(savedConfig?.target?.toString() ?? '');
  const [resultData, setResultData] = useState<CapabilityResult | null>(savedData?.result ?? null);
  const [normResult, setNormResult] = useState<{ ad: { statistic: number; pValue: number }; sw: { statistic: number; pValue: number }; ks: { statistic: number; pValue: number } } | null>(null);

  const options = useMemo(() => {
    if (!table) return [];
    return Array.from({ length: table.columns }, (_, i) => {
      const sub = getSubHeader(tableId, i);
      return { value: i, label: sub ? `${columnName(i)} - ${sub}` : columnName(i) };
    });
  }, [table, tableId, getSubHeader]);

  const handleRun = () => {
    if (selectedCol == null) return;
    const data = getColumnData(tableId, selectedCol);
    if (data.length < 3) return;
    const dStats = descriptiveStats(data);
    const dataMean = dStats.mean;
    const autoLsl = lsl !== '' ? Number(lsl) : dataMean - 3 * dStats.stddev;
    const autoUsl = usl !== '' ? Number(usl) : dataMean + 3 * dStats.stddev;
    const autoTarget = target !== '' ? Number(target) : (autoLsl + autoUsl) / 2;
    const result = capabilityAnalysis(data, { lsl: autoLsl, usl: autoUsl, target: autoTarget });
    setResultData(result);
    const nt = normalityTest(data);
    setNormResult(nt);
    updateResultData(resultId, {
      col: selectedCol,
      lsl: lsl !== '' ? Number(lsl) : undefined,
      usl: usl !== '' ? Number(usl) : undefined,
      target: target !== '' ? Number(target) : undefined,
    }, { result, norm: nt } as Record<string, unknown>);
  };

  const chartOption: EChartsOption | null = useMemo(() => {
    if (!resultData || selectedCol == null) return null;
    const rawData = getColumnData(tableId, selectedCol);
    if (rawData.length === 0) return null;
    const { mean, overallStddev, lsl: specLsl, usl: specUsl, target: specTarget } = resultData;
    const n = rawData.length;

    // Scott's rule for optimal bin width
    const binWidth = 3.5 * overallStddev / Math.pow(n, 1 / 3);
    const dataMin = Math.min(...rawData);
    const dataMax = Math.max(...rawData);
    const padding = overallStddev * 0.5;
    const chartMin = Math.floor((Math.min(dataMin, specLsl) - padding) / binWidth) * binWidth;
    const chartMax = Math.ceil((Math.max(dataMax, specUsl) + padding) / binWidth) * binWidth;
    const bins = Math.max(8, Math.round((chartMax - chartMin) / binWidth));
    const actualWidth = (chartMax - chartMin) / bins;

    const histData: number[] = new Array(bins).fill(0);
    for (const val of rawData) {
      const idx = Math.min(bins - 1, Math.max(0, Math.floor((val - chartMin) / actualWidth)));
      histData[idx]++;
    }

    const curveStep = (chartMax - chartMin) / 200;
    const curveX: number[] = [];
    const curveY: number[] = [];
    for (let x = chartMin; x <= chartMax; x += curveStep) {
      curveX.push(x);
      const z = (x - mean) / overallStddev;
      curveY.push((n * actualWidth / (overallStddev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z));
    }

    // Only add spec lines when values are explicitly provided
    const lslGiven = lsl !== '';
    const uslGiven = usl !== '';
    const targetGiven = target !== '';

    const markLines: Record<string, unknown>[] = [];
    if (lslGiven && isFinite(specLsl)) {
      markLines.push({
        name: 'LSL', xAxis: specLsl,
        lineStyle: { color: '#ef4444', type: 'dashed' as const, width: 2 },
        label: { formatter: `LSL = ${specLsl.toFixed(3)}`, position: 'insideEndTop' as const, distance: 10 },
      });
    }
    if (uslGiven && isFinite(specUsl)) {
      markLines.push({
        name: 'USL', xAxis: specUsl,
        lineStyle: { color: '#ef4444', type: 'dashed' as const, width: 2 },
        label: { formatter: `USL = ${specUsl.toFixed(3)}`, position: 'insideEndTop' as const, distance: 10 },
      });
    }
    if (targetGiven && isFinite(specTarget)) {
      markLines.push({
        name: '目标', xAxis: specTarget,
        lineStyle: { color: '#10b981', type: 'dashed' as const, width: 2 },
        label: { formatter: `目标 = ${specTarget.toFixed(3)}`, position: 'insideEndTop' as const, distance: 10 },
      });
    }

    return {
      title: { text: '过程能力分析', left: 'center', textStyle: { fontSize: 14, fontWeight: 'bold' } },
      tooltip: { trigger: 'axis' as const },
      xAxis: { type: 'value' as const, min: chartMin, max: chartMax, axisLabel: { formatter: (v: number) => v.toFixed(1) } },
      yAxis: {
        type: 'value' as const,
        name: '频次',
        nameLocation: 'center' as const,
        nameGap: 35,
        position: 'left' as const,
        offset: 0,
      },
      grid: { left: 60, right: 20, top: 60, bottom: 40 },
      series: [
        {
          type: 'bar',
          data: histData.map((v, i) => [chartMin + (i + 0.5) * actualWidth, v]),
          name: '频次', color: '#3b82f6',
          barWidth: '99%', barCategoryGap: '0%', barGap: '0%',
        },
        {
          type: 'line',
          data: curveX.map((x, i) => [x, curveY[i]]),
          name: '正态拟合', smooth: true, color: '#ef4444',
          lineStyle: { width: 2 }, symbol: 'none' as const,
          markLine: markLines.length > 0 ? { silent: true, symbol: 'none' as const, data: markLines } : undefined,
        },
      ],
    };
  }, [resultData, selectedCol, tableId, getColumnData, lsl, usl, target]);

  if (!table) return <div className="p-4 text-gray-500">工作表不存在</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">过程能力分析 - 配置</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-gray-600 w-[80px]">数据列</label>
          <select className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white" value={selectedCol ?? ''} onChange={(e) => setSelectedCol(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">请选择...</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">规格下限</label>
          <input className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" type="number" value={lsl} onChange={(e) => setLsl(e.target.value)} placeholder="LSL" />
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">目标中值</label>
          <input className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="目标" />
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">规格上限</label>
          <input className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" type="number" value={usl} onChange={(e) => setUsl(e.target.value)} placeholder="USL" />
          <button onClick={handleRun} disabled={selectedCol == null} className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40 ml-3">执行分析</button>
        </div>
      </div>

      {resultData && (
        <div>
          <div className="flex gap-3">
            <div className="w-48 flex-shrink-0 text-xs">
              <table className="w-full border-collapse">
                <tbody>
                  {[['样本量',resultData.n],['均值',resultData.mean.toFixed(4)],['规格下限',resultData.lsl.toFixed(4)],['目标中值',resultData.target.toFixed(4)],['规格上限',resultData.usl.toFixed(4)],['整体标准差',resultData.overallStddev.toFixed(4)],['组内标准差',resultData.withinStddev.toFixed(4)],['组间标准差',resultData.betweenStddev.toFixed(4)]].map(([l,v])=>(<tr key={l as string} className="border-b border-gray-100"><td className="py-0.5 text-gray-500">{l}</td><td className="py-0.5 text-right font-mono text-gray-700">{typeof v==='number'?v:v}</td></tr>))}
                </tbody>
              </table>
            </div>
            <div className="flex-1 min-w-0">{chartOption && <ChartContainer option={chartOption} height={360} />}</div>
            <div className="w-44 flex-shrink-0 text-xs">
              <table className="w-full border-collapse">
                <thead><tr className="border-b border-gray-200"><td colSpan={2} className="py-1 font-semibold text-gray-700 text-center">整体能力</td></tr></thead>
                <tbody>{[['Pp',resultData.pp],['PPL',resultData.ppl],['PPU',resultData.ppu],['PPk',resultData.ppk],['CPM',resultData.cpm]].map(([l,v])=>(<tr key={l} className="border-b border-gray-100"><td className="py-0.5 text-gray-500">{l}</td><td className="py-0.5 text-right font-mono text-gray-700">{v.toFixed(2)}</td></tr>))}</tbody>
                <thead><tr className="border-b border-gray-200"><td colSpan={2} className="py-1 pt-2 font-semibold text-gray-700 text-center">组内能力</td></tr></thead>
                <tbody>{[['Cp',resultData.cp],['CPL',resultData.cpl],['CPU',resultData.cpu],['Cpk',resultData.cpk]].map(([l,v])=>(<tr key={l} className="border-b border-gray-100"><td className="py-0.5 text-gray-500">{l}</td><td className="py-0.5 text-right font-mono text-gray-700">{v.toFixed(2)}</td></tr>))}</tbody>
              </table>
            </div>
          </div>

                    {/* Equal-width PPM + normality test tables */}
          {resultData && (
            <div className="flex gap-3 mt-2">
              <div className="flex-1 text-xs">
                <table className="w-full border-collapse border border-gray-200">
                  <thead><tr className="bg-gray-50"><th className="px-2 py-1 border border-gray-200 text-left">百万分之不良率</th><th className="px-2 py-1 border border-gray-200 text-right">观测值</th><th className="px-2 py-1 border border-gray-200 text-right">预期值</th></tr></thead>
                  <tbody>
                    <tr><td className="px-2 py-1 border border-gray-200">超规格下限 PPM</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{resultData.ppmBelowLslObs.toFixed(0)}</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{resultData.ppmBelowLslExp.toFixed(0)}</td></tr>
                    <tr><td className="px-2 py-1 border border-gray-200">超规格上限 PPM</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{resultData.ppmAboveUslObs.toFixed(0)}</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{resultData.ppmAboveUslExp.toFixed(0)}</td></tr>
                    <tr className="font-semibold"><td className="px-2 py-1 border border-gray-200">合计 PPM</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{resultData.ppmTotalObs.toFixed(0)}</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{resultData.ppmTotalExp.toFixed(0)}</td></tr>
                  </tbody>
                </table>
              </div>
              {normResult && (
                <div className="flex-1 text-xs">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead><tr className="bg-gray-50"><th className="px-2 py-1 border border-gray-200 text-left">正态检验</th><th className="px-2 py-1 border border-gray-200 text-right">统计量</th><th className="px-2 py-1 border border-gray-200 text-right">P 值</th></tr></thead>
                    <tbody>
                      <tr><td className="px-2 py-1 border border-gray-200">Anderson-Darling</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{normResult.ad.statistic.toFixed(4)}</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{normResult.ad.pValue.toFixed(4)}</td></tr>
                      <tr><td className="px-2 py-1 border border-gray-200">Shapiro-Wilk</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{normResult.sw.statistic.toFixed(4)}</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{normResult.sw.pValue.toFixed(4)}</td></tr>
                      <tr><td className="px-2 py-1 border border-gray-200">Kolmogorov-Smirnov</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{normResult.ks.statistic.toFixed(4)}</td><td className="px-2 py-1 border border-gray-200 text-right font-mono">{normResult.ks.pValue.toFixed(4)}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}    </div>
      )}
    </div>
  );
};
