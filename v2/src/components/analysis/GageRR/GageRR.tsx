import React, { useMemo, useState } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { analysisRegistry } from '../../../analysis/registry';
import { type GageRRResult } from '../../../stats/gageRR';
import { computeAxisRange } from '../../../utils/axisRange';
import { columnName } from '../../../utils/columnName';
import { ChartContainer } from '../../common/ChartContainer';
import { StatisticalTable } from '../../common/StatisticalTable';
import type { EChartsOption } from 'echarts';

interface GageRRProps {
  tableId: string;
  resultId: string;
}

export const GageRR: React.FC<GageRRProps> = ({ tableId, resultId }) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const results = useAnalysisStore((s) => s.results);
  const updateResultData = useAnalysisStore((s) => s.updateResultData);

  const saved = results[resultId];
  const savedConfig = saved?.config as
    | { partCol?: number; operatorCol?: number; measurementCol?: number }
    | undefined;
  const savedData = saved?.data as { result?: GageRRResult | null } | undefined;
  const [partCol, setPartCol] = useState<number | null>(
    savedConfig?.partCol ?? null
  );
  const [operatorCol, setOperatorCol] = useState<number | null>(
    savedConfig?.operatorCol ?? null
  );
  const [measurementCol, setMeasurementCol] = useState<number | null>(
    savedConfig?.measurementCol ?? null
  );
  const [resultData, setResultData] = useState<GageRRResult | null>(
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
    const config = { partCol, operatorCol, measurementCol };
    const output = analysisRegistry['gage-rr'].run(tableId, config);
    const result = output.data.result as GageRRResult | null;
    setResultData(result);
    updateResultData(resultId, output.config, output.data);
  };

  const chartOption: EChartsOption | null = useMemo(() => {
    if (!resultData) return null;
    const parts = resultData.partStats.map((p) => p.part);
    const operators = resultData.operatorStats.map((o) => o.operator);
    const values = resultData.comboStats.map((c) => c.mean);
    const yRange = computeAxisRange(values);
    const series = operators.map((op) => ({
      type: 'scatter' as const,
      name: op,
      symbolSize: 8,
      data: resultData.comboStats
        .filter((c) => c.operator === op)
        .map((c) => [parts.indexOf(c.part), c.mean]),
    }));
    return {
      title: { text: '零件 × 操作员均值', left: 'center', textStyle: { fontSize: 13 } },
      tooltip: { trigger: 'item' as const },
      xAxis: {
        type: 'category' as const,
        data: parts,
        name: '零件',
      },
      yAxis: {
        type: 'value' as const,
        name: '测量均值',
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
      series,
    };
  }, [resultData]);

  if (!table) return <div className="p-4 text-gray-500">工作表不存在</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Gage R&R - 配置</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-gray-600 w-[90px]">零件列</label>
          <select
            className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
            value={partCol ?? ''}
            onChange={(e) =>
              setPartCol(e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">请选择...</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="text-sm font-medium text-gray-600 w-[90px] ml-3">
            操作员列
          </label>
          <select
            className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
            value={operatorCol ?? ''}
            onChange={(e) =>
              setOperatorCol(e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">请选择...</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="text-sm font-medium text-gray-600 w-[90px] ml-3">
            测量值列
          </label>
          <select
            className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
            value={measurementCol ?? ''}
            onChange={(e) =>
              setMeasurementCol(e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">请选择...</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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

      {resultData && (
        <div className="space-y-3">
          <StatisticalTable
            title="测量系统分析（均值-极差法）"
            columns={[
              { key: 'label', label: '项目' },
              { key: 'value', label: '值' },
            ]}
            data={[
              { label: '重复性 EV', value: resultData.ev.toFixed(4) },
              { label: '再现性 AV', value: resultData.av.toFixed(4) },
              { label: 'GRR', value: resultData.grr.toFixed(4) },
              { label: '零件变异 PV', value: resultData.pv.toFixed(4) },
              { label: '总变异 TV', value: resultData.tv.toFixed(4) },
              { label: '%GRR', value: `${resultData.grrPct.toFixed(2)}%` },
              { label: '%EV', value: `${resultData.evPct.toFixed(2)}%` },
              { label: '%AV', value: `${resultData.avPct.toFixed(2)}%` },
              { label: '%PV', value: `${resultData.pvPct.toFixed(2)}%` },
              { label: 'ndc', value: resultData.ndc },
            ]}
          />
          {chartOption && <ChartContainer option={chartOption} height={320} />}
        </div>
      )}
    </div>
  );
};
