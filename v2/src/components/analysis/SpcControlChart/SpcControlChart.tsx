import React, { useMemo, useState } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { analysisRegistry } from '../../../analysis/registry';
import { type SpcChartResult, type SpcChartType, type SpcResult } from '../../../stats/spc';
import { computeAxisRange } from '../../../utils/axisRange';
import { columnName } from '../../../utils/columnName';
import { ChartContainer } from '../../common/ChartContainer';
import { StatisticalTable } from '../../common/StatisticalTable';
import type { EChartsOption } from 'echarts';

interface SpcControlChartProps {
  tableId: string;
  resultId: string;
}

const CHART_TYPES: { value: SpcChartType; label: string }[] = [
  { value: 'i-mr', label: 'I-MR' },
  { value: 'xbar-r', label: 'Xbar-R' },
  { value: 'xbar-s', label: 'Xbar-S' },
  { value: 'p', label: 'P' },
  { value: 'np', label: 'NP' },
  { value: 'c', label: 'C' },
  { value: 'u', label: 'U' },
];

export const SpcControlChart: React.FC<SpcControlChartProps> = ({
  tableId,
  resultId,
}) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const results = useAnalysisStore((s) => s.results);
  const updateResultData = useAnalysisStore((s) => s.updateResultData);

  const saved = results[resultId];
  const savedConfig = saved?.config as
    | {
        chartType?: SpcChartType;
        dataCol?: number;
        subgroupCol?: number;
        subgroupSize?: number;
        countCol?: number;
        sizeCol?: number;
        unitCol?: number;
      }
    | undefined;
  const savedData = saved?.data as { result?: SpcResult | null } | undefined;

  const [chartType, setChartType] = useState<SpcChartType>(
    savedConfig?.chartType ?? 'i-mr'
  );
  const [dataCol, setDataCol] = useState<number | null>(
    savedConfig?.dataCol ?? null
  );
  const [subgroupCol, setSubgroupCol] = useState<number | null>(
    savedConfig?.subgroupCol ?? null
  );
  const [subgroupSize, setSubgroupSize] = useState(
    savedConfig?.subgroupSize?.toString() ?? '5'
  );
  const [countCol, setCountCol] = useState<number | null>(
    savedConfig?.countCol ?? null
  );
  const [sizeCol, setSizeCol] = useState<number | null>(
    savedConfig?.sizeCol ?? null
  );
  const [unitCol, setUnitCol] = useState<number | null>(
    savedConfig?.unitCol ?? null
  );
  const [resultData, setResultData] = useState<SpcResult | null>(
    savedData?.result ?? null
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

  const handleRun = () => {
    const config = {
      chartType,
      dataCol,
      subgroupCol: subgroupCol ?? undefined,
      subgroupSize: Number(subgroupSize) || undefined,
      countCol,
      sizeCol,
      unitCol,
    };
    const output = analysisRegistry['spc-control-chart'].run(tableId, config);
    const result = output.data.result as SpcResult | null;
    setResultData(result);
    updateResultData(resultId, output.config, output.data);
  };

  const buildChartOption = (chart: SpcChartResult): EChartsOption => {
    const yValues = [
      ...chart.points.map((p) => p.value),
      chart.centerline,
      ...chart.ucl.filter((v): v is number => v != null),
      ...chart.lcl.filter((v): v is number => v != null),
    ];
    const yRange = computeAxisRange(yValues);
    return {
      title: { text: chart.title, left: 'center', textStyle: { fontSize: 13 } },
      tooltip: { trigger: 'axis' as const },
      xAxis: {
        type: 'category' as const,
        data: chart.points.map((_, i) => String(i + 1)),
        boundaryGap: false,
      },
      yAxis: {
        type: 'value' as const,
        scale: true,
        min: yRange.min,
        max: yRange.max,
        minInterval: 1,
        axisLabel: {
          showMinLabel: false,
          showMaxLabel: false,
          formatter: (value: number) => String(Math.round(value)),
        },
      },
      series: [
        {
          type: 'line' as const,
          data: chart.points.map((p) => p.value),
          symbolSize: 4,
          lineStyle: { color: '#3b82f6', width: 1.5 },
          markPoint: {
            data: chart.outOfControl.map((i) => ({
              coord: [i, chart.points[i].value],
              name: `异常 ${i + 1}`,
              value: chart.points[i].value,
              itemStyle: { color: '#dc2626' },
            })),
          },
        },
        {
          type: 'line' as const,
          name: 'UCL',
          data: chart.ucl,
          lineStyle: { color: '#dc2626', type: 'dashed' as const },
          symbol: 'none' as const,
        },
        {
          type: 'line' as const,
          name: 'LCL',
          data: chart.lcl,
          lineStyle: { color: '#dc2626', type: 'dashed' as const },
          symbol: 'none' as const,
        },
        {
          type: 'line' as const,
          name: 'CL',
          data: chart.points.map(() => chart.centerline),
          lineStyle: { color: '#10b981', width: 1 },
          symbol: 'none' as const,
        },
      ],
    };
  };

  if (!table) return <div className="p-4 text-gray-500">工作表不存在</div>;

  const variableChart = chartType === 'i-mr' || chartType === 'xbar-r' || chartType === 'xbar-s';

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">SPC 控制图 - 配置</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-gray-600 w-[80px]">图类型</label>
          <select
            className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
            value={chartType}
            onChange={(e) => setChartType(e.target.value as SpcChartType)}
          >
            {CHART_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {variableChart ? (
            <>
              <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
                数据列
              </label>
              <select
                className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                value={dataCol ?? ''}
                onChange={(e) =>
                  setDataCol(e.target.value === '' ? null : Number(e.target.value))
                }
              >
                <option value="">请选择...</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
                子组列
              </label>
              <select
                className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                value={subgroupCol ?? ''}
                onChange={(e) =>
                  setSubgroupCol(e.target.value === '' ? null : Number(e.target.value))
                }
              >
                <option value="">无（按固定大小）</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {chartType !== 'i-mr' && (
                <>
                  <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
                    子组大小
                  </label>
                  <input
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm"
                    type="number"
                    min={2}
                    value={subgroupSize}
                    onChange={(e) => setSubgroupSize(e.target.value)}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
                计数列
              </label>
              <select
                className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                value={countCol ?? ''}
                onChange={(e) =>
                  setCountCol(e.target.value === '' ? null : Number(e.target.value))
                }
              >
                <option value="">请选择...</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {(chartType === 'p' || chartType === 'np') && (
                <>
                  <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
                    样本量列
                  </label>
                  <select
                    className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                    value={sizeCol ?? ''}
                    onChange={(e) =>
                      setSizeCol(e.target.value === '' ? null : Number(e.target.value))
                    }
                  >
                    <option value="">请选择...</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {chartType === 'u' && (
                <>
                  <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
                    检验单位列
                  </label>
                  <select
                    className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                    value={unitCol ?? ''}
                    onChange={(e) =>
                      setUnitCol(e.target.value === '' ? null : Number(e.target.value))
                    }
                  >
                    <option value="">请选择...</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </>
          )}
          <button
            onClick={handleRun}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 ml-3"
          >
            执行分析
          </button>
        </div>
      </div>

      {resultData?.warnings.map((w) => (
        <p key={w} className="text-sm text-amber-700">
          {w}
        </p>
      ))}

      {resultData?.charts.map((chart) => (
        <div key={chart.title} className="space-y-1">
          <ChartContainer option={buildChartOption(chart)} height={280} />
          <StatisticalTable
            title={chart.title}
            columns={[
              { key: 'label', label: '项目' },
              { key: 'value', label: '值' },
            ]}
            data={[
              { label: '中心线', value: chart.centerline.toFixed(4) },
              { label: 'UCL', value: (chart.ucl[0] ?? 0).toFixed(4) },
              { label: 'LCL', value: (chart.lcl[0] ?? 0).toFixed(4) },
              { label: '异常点', value: chart.outOfControl.length },
            ]}
          />
        </div>
      ))}
    </div>
  );
};
