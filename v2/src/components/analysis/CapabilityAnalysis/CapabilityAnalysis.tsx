import React, { useMemo, useState } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import {
  capabilityAnalysis,
  type CapabilityResult,
} from '../../../stats/capability';
import { descriptiveStats } from '../../../stats/descriptive';
import { computeHistogramBins } from '../../../stats/histogram';
import { columnName } from '../../../utils/columnName';
import { ChartContainer } from '../../common/ChartContainer';
import type { EChartsOption } from 'echarts';
import { zh } from '../../../i18n/zh';

interface CapabilityAnalysisProps {
  tableId: string;
  resultId: string;
}

export const CapabilityAnalysis: React.FC<CapabilityAnalysisProps> = ({
  tableId,
  resultId,
}) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getColumnData = useTableStore((s) => s.getColumnData);
  const results = useAnalysisStore((s) => s.results);
  const updateResultData = useAnalysisStore((s) => s.updateResultData);

  const saved = results[resultId];
  const savedConfig = saved?.config as
    | {
        col?: number;
        lsl?: number;
        usl?: number;
        target?: number;
        title?: string;
        titleEdited?: boolean;
        lslEdited?: boolean;
        uslEdited?: boolean;
        targetEdited?: boolean;
      }
    | undefined;
  const savedData = saved?.data as
    | { result?: CapabilityResult | null }
    | undefined;

  const buildDefaultTitle = (col: number): string => {
    const sub = getSubHeader(tableId, col);
    return `${sub || columnName(col)} ${zh.analysis.capability}`;
  };

  const buildDefaultLimits = (col: number) => {
    const data = getColumnData(tableId, col);
    if (data.length < 2) {
      return { lsl: '', usl: '', target: '' };
    }
    const stats = descriptiveStats(data);
    const defaultLsl = stats.mean - 3 * stats.stddev;
    const defaultUsl = stats.mean + 3 * stats.stddev;
    return {
      lsl: defaultLsl.toFixed(4),
      usl: defaultUsl.toFixed(4),
      target: ((defaultLsl + defaultUsl) / 2).toFixed(4),
    };
  };

  const [selectedCol, setSelectedCol] = useState<number | null>(
    savedConfig?.col ?? null
  );
  const initialLimits =
    savedConfig?.col != null ? buildDefaultLimits(savedConfig.col) : { lsl: '', usl: '', target: '' };
  const [lsl, setLsl] = useState(
    savedConfig?.lslEdited ? savedConfig.lsl?.toString() ?? '' : initialLimits.lsl
  );
  const [usl, setUsl] = useState(
    savedConfig?.uslEdited ? savedConfig.usl?.toString() ?? '' : initialLimits.usl
  );
  const [target, setTarget] = useState(
    savedConfig?.targetEdited
      ? savedConfig.target?.toString() ?? ''
      : initialLimits.target
  );
  const [resultData, setResultData] = useState<CapabilityResult | null>(
    savedData?.result ?? null
  );
  const [message, setMessage] = useState('');
  const [chartTitle, setChartTitle] = useState<string>(
    savedConfig?.titleEdited
      ? savedConfig.title ?? ''
      : savedConfig?.title?.trim() ||
          (savedConfig?.col != null
            ? buildDefaultTitle(savedConfig.col)
            : zh.analysis.capability)
  );
  const [titleTouched, setTitleTouched] = useState<boolean>(
    Boolean(savedConfig?.titleEdited)
  );
  const [lslTouched, setLslTouched] = useState<boolean>(
    Boolean(savedConfig?.lslEdited)
  );
  const [uslTouched, setUslTouched] = useState<boolean>(
    Boolean(savedConfig?.uslEdited)
  );
  const [targetTouched, setTargetTouched] = useState<boolean>(
    Boolean(savedConfig?.targetEdited)
  );

  const options = useMemo(() => {
    if (!table) return [];
    return Array.from({ length: table.columns }, (_, i) => {
      const sub = getSubHeader(tableId, i);
      return {
        value: i,
        label: sub ? `${columnName(i)} - ${sub}` : columnName(i),
      };
    });
  }, [table, tableId, getSubHeader]);

  const handleColumnChange = (raw: string) => {
    const col = raw === '' ? null : Number(raw);
    setSelectedCol(col);
    if (col == null) return;
    const limits = buildDefaultLimits(col);
    if (!titleTouched) {
      setChartTitle(buildDefaultTitle(col));
    }
    if (!lslTouched) {
      setLsl(limits.lsl);
    }
    if (!uslTouched) {
      setUsl(limits.usl);
    }
    if (!targetTouched) {
      setTarget(limits.target);
    }
  };

  const persistTitle = (title: string) => {
    updateResultData(
      resultId,
      {
        ...saved?.config,
        col: selectedCol,
        lsl: lsl !== '' ? Number(lsl) : undefined,
        usl: usl !== '' ? Number(usl) : undefined,
        target: target !== '' ? Number(target) : undefined,
        lslEdited: lslTouched,
        uslEdited: uslTouched,
        targetEdited: targetTouched,
        title,
        titleEdited: true,
      },
      saved?.data ?? {}
    );
  };

  const handleRun = () => {
    if (selectedCol == null) return;
    const data = getColumnData(tableId, selectedCol);
    if (data.length < 2) {
      setResultData(null);
      setMessage(zh.spreadsheet.sampleInsufficient);
      updateResultData(
        resultId,
        {
          col: selectedCol,
          lsl: undefined,
          usl: undefined,
          target: undefined,
          lslEdited: lslTouched,
          uslEdited: uslTouched,
          targetEdited: targetTouched,
          title: chartTitle,
          titleEdited: titleTouched,
        },
        { result: null }
      );
      return;
    }

    const stats = descriptiveStats(data);
    const autoLsl = stats.mean - 3 * stats.stddev;
    const autoUsl = stats.mean + 3 * stats.stddev;
    const finalLsl = lsl !== '' ? Number(lsl) : autoLsl;
    const finalUsl = usl !== '' ? Number(usl) : autoUsl;
    const finalTarget =
      target !== '' ? Number(target) : (finalLsl + finalUsl) / 2;
    const result = capabilityAnalysis(data, {
      lsl: finalLsl,
      usl: finalUsl,
      target: finalTarget,
    });
    setResultData(result);
    setMessage('');
    updateResultData(
      resultId,
      {
        col: selectedCol,
        lsl: lsl !== '' ? Number(lsl) : undefined,
        usl: usl !== '' ? Number(usl) : undefined,
        target: target !== '' ? Number(target) : undefined,
        lslEdited: lslTouched,
        uslEdited: uslTouched,
        targetEdited: targetTouched,
        title: chartTitle,
        titleEdited: titleTouched,
      },
      { result }
    );
  };

  const chartOption: EChartsOption | null = useMemo(() => {
    if (!resultData || selectedCol == null) return null;
    const rawData = getColumnData(tableId, selectedCol);
    if (rawData.length === 0) return null;
    const { mean, overallStddev, lsl: specLsl, usl: specUsl, target: specTarget } = resultData;
    if (overallStddev === 0) return null;

    const histogram = computeHistogramBins(rawData);
    let chartMin = histogram.min;
    let chartMax = histogram.max;
    if (specLsl < chartMin) {
      chartMin =
        Math.floor(specLsl / histogram.binWidth) * histogram.binWidth;
    }
    if (specUsl > chartMax) {
      chartMax =
        Math.ceil(specUsl / histogram.binWidth) * histogram.binWidth;
    }
    const bins = Math.max(
      histogram.bins,
      Math.min(100, Math.round((chartMax - chartMin) / histogram.binWidth))
    );
    const actualWidth = (chartMax - chartMin) / bins;
    const histData = new Array(bins).fill(0);
    for (const val of rawData) {
      const idx = Math.min(
        bins - 1,
        Math.max(0, Math.floor((val - chartMin) / actualWidth))
      );
      histData[idx]++;
    }

    const curveStep = (chartMax - chartMin) / 200;
    const curveX: number[] = [];
    const curveY: number[] = [];
    for (let x = chartMin; x <= chartMax; x += curveStep) {
      curveX.push(x);
      const z = (x - mean) / overallStddev;
      curveY.push(
        (rawData.length * actualWidth / (overallStddev * Math.sqrt(2 * Math.PI))) *
          Math.exp(-0.5 * z * z)
      );
    }

    const markLines: Record<string, unknown>[] = [
      {
        name: 'LSL',
        xAxis: specLsl,
        lineStyle: { color: '#dc2626', type: 'dashed' as const, width: 2 },
        label: {
          formatter: `LSL = ${specLsl.toFixed(3)}`,
          position: 'end' as const,
          distance: 16,
          fontSize: 10,
        },
      },
      {
        name: 'USL',
        xAxis: specUsl,
        lineStyle: { color: '#dc2626', type: 'dashed' as const, width: 2 },
        label: {
          formatter: `USL = ${specUsl.toFixed(3)}`,
          position: 'end' as const,
          distance: 16,
          fontSize: 10,
        },
      },
      {
        name: '目标',
        xAxis: specTarget,
        lineStyle: { color: '#10b981', type: 'dashed' as const, width: 2 },
        label: {
          formatter: `目标 = ${specTarget.toFixed(3)}`,
          position: 'end' as const,
          distance: 16,
          fontSize: 10,
        },
      },
    ];

    return {
      title: {
        text: chartTitle,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold' },
      },
      tooltip: { trigger: 'axis' as const },
      xAxis: {
        type: 'value' as const,
        min: chartMin,
        max: chartMax,
        axisLabel: { formatter: (v: number) => v.toFixed(1) },
      },
      yAxis: {
        type: 'value' as const,
        name: '频次',
        nameLocation: 'middle' as const,
        nameGap: 35,
      },
      grid: { left: 60, right: 20, top: 75, bottom: 40 },
      series: [
        {
          type: 'bar',
          data: histData.map((v, i) => [chartMin + (i + 0.5) * actualWidth, v]),
          name: '频次',
          color: '#3b82f6',
          barWidth: '100%',
          barCategoryGap: '0%',
          barGap: '0%',
        },
        {
          type: 'line',
          data: curveX.map((x, i) => [x, curveY[i]]),
          name: '正态拟合',
          smooth: true,
          color: '#dc2626',
          lineStyle: { width: 2 },
          symbol: 'none' as const,
          markLine: { silent: true, symbol: 'none' as const, data: markLines },
        },
      ],
    };
  }, [resultData, selectedCol, tableId, getColumnData, chartTitle]);

  const caValue = resultData
    ? Number.isFinite(resultData.ca)
      ? resultData.ca
      : resultData.usl - resultData.lsl === 0
        ? 0
        : (resultData.mean - resultData.target) /
          ((resultData.usl - resultData.lsl) / 2)
    : 0;

  if (!table) return <div className="p-4 text-gray-500">{zh.workspace.tableMissing}</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {zh.analysis.capability} - 配置
        </h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 w-[80px]">
            {zh.analysis.chartTitle}
          </label>
          <input
            className="flex-1 max-w-xl px-2 py-1.5 border border-gray-300 rounded text-sm"
            type="text"
            value={chartTitle}
            onChange={(e) => {
              const value = e.target.value;
              setChartTitle(value);
              setTitleTouched(true);
              persistTitle(value);
            }}
            placeholder={zh.analysis.capability}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600 w-[80px]">
            {zh.analysis.selectColumn}
          </label>
          <select
            className="min-w-[150px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
            value={selectedCol ?? ''}
            onChange={(e) => handleColumnChange(e.target.value)}
          >
            <option value="">请选择...</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
            {zh.analysis.lsl}
          </label>
          <input
            className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
            type="number"
            value={lsl}
            onChange={(e) => {
              setLsl(e.target.value);
              setLslTouched(true);
            }}
            placeholder="LSL"
          />
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
            {zh.analysis.target}
          </label>
          <input
            className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
            type="number"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setTargetTouched(true);
            }}
            placeholder="目标"
          />
          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
            {zh.analysis.usl}
          </label>
          <input
            className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
            type="number"
            value={usl}
            onChange={(e) => {
              setUsl(e.target.value);
              setUslTouched(true);
            }}
            placeholder="USL"
          />
          <button
            onClick={handleRun}
            disabled={selectedCol == null}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40 ml-3"
          >
            {zh.analysis.run}
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-amber-700">{message}</p>}

      {resultData && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="w-56 flex-shrink-0 text-xs">
              <table className="w-full border-collapse">
                <tbody>
                  {(
                    [
                      ['样本量', resultData.n],
                      ['均值', resultData.mean.toFixed(4)],
                      ['规格下限', resultData.lsl.toFixed(4)],
                      ['目标值', resultData.target.toFixed(4)],
                      ['CA', `${(caValue * 100).toFixed(2)}%`],
                      ['规格上限', resultData.usl.toFixed(4)],
                      ['整体标准差', resultData.overallStddev.toFixed(4)],
                      ['组内标准差', resultData.withinStddev.toFixed(4)],
                    ] as [string, string | number][]
                  ).map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-100">
                      <td className="py-0.5 text-gray-500">{label}</td>
                      <td className="py-0.5 text-right font-mono text-gray-700">
                        {typeof value === 'number' ? value : value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex-1 min-w-0">
              {chartOption && <ChartContainer option={chartOption} height={360} />}
            </div>
            <div className="w-44 flex-shrink-0 text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <td colSpan={2} className="py-1 font-semibold text-gray-700 text-center">
                      整体能力
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ['Pp', resultData.pp],
                      ['PPL', resultData.ppl],
                      ['PPU', resultData.ppu],
                      ['PPk', resultData.ppk],
                      ['CPM', resultData.cpm],
                    ] as [string, number][]
                  ).map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-100">
                      <td className="py-0.5 text-gray-500">{label}</td>
                      <td className="py-0.5 text-right font-mono text-gray-700">
                        {value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <thead>
                  <tr className="border-b border-gray-200">
                    <td colSpan={2} className="py-1 pt-2 font-semibold text-gray-700 text-center">
                      组内能力
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ['Cp', resultData.cp],
                      ['CPL', resultData.cpl],
                      ['CPU', resultData.cpu],
                      ['Cpk', resultData.cpk],
                    ] as [string, number][]
                  ).map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-100">
                      <td className="py-0.5 text-gray-500">{label}</td>
                      <td className="py-0.5 text-right font-mono text-gray-700">
                        {value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-80 text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <td className="py-1 font-semibold text-gray-700">
                    百万分之不良率
                  </td>
                  <td className="py-1 text-right text-gray-500">
                    观测值
                  </td>
                  <td className="py-1 text-right text-gray-500">
                    期望值
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-0.5 text-gray-500">低于下限 PPM</td>
                  <td className="py-0.5 text-right font-mono text-gray-700">
                    {resultData.ppmBelowLslObs.toFixed(0)}
                  </td>
                  <td className="py-0.5 text-right font-mono text-gray-700">
                    {resultData.ppmBelowLslExp.toFixed(0)}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-0.5 text-gray-500">高于上限 PPM</td>
                  <td className="py-0.5 text-right font-mono text-gray-700">
                    {resultData.ppmAboveUslObs.toFixed(0)}
                  </td>
                  <td className="py-0.5 text-right font-mono text-gray-700">
                    {resultData.ppmAboveUslExp.toFixed(0)}
                  </td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-0.5 text-gray-700">合计 PPM</td>
                  <td className="py-0.5 text-right font-mono text-gray-700">
                    {resultData.ppmTotalObs.toFixed(0)}
                  </td>
                  <td className="py-0.5 text-right font-mono text-gray-700">
                    {resultData.ppmTotalExp.toFixed(0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
