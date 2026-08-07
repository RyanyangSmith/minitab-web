import React, { useMemo, useState } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { descriptiveSummary, type DescriptiveSummary } from '../../../stats/descriptive';
import { columnName } from '../../../utils/columnName';
import { zh } from '../../../i18n/zh';

interface DescriptiveStatisticsProps {
  tableId: string;
  resultId: string;
}

const METRICS: [string, (s: DescriptiveSummary) => string | number][] = [
  ['N', (s) => s.n],
  ['均值', (s) => s.mean.toFixed(4)],
  ['中位数', (s) => s.median.toFixed(4)],
  ['标准差', (s) => s.stddev.toFixed(4)],
  ['方差', (s) => s.variance.toFixed(4)],
  ['Min', (s) => s.min.toFixed(4)],
  ['Max', (s) => s.max.toFixed(4)],
  ['极差', (s) => s.range.toFixed(4)],
  ['Q1', (s) => s.q1.toFixed(4)],
  ['Q3', (s) => s.q3.toFixed(4)],
  ['95% CI 下限', (s) => s.ciLower.toFixed(4)],
  ['95% CI 上限', (s) => s.ciUpper.toFixed(4)],
];

export const DescriptiveStatistics: React.FC<DescriptiveStatisticsProps> = ({
  tableId,
  resultId,
}) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getColumnData = useTableStore((s) => s.getColumnData);
  const results = useAnalysisStore((s) => s.results);
  const updateResultData = useAnalysisStore((s) => s.updateResultData);

  const saved = results[resultId];
  const savedConfig = saved?.config as { cols?: number[] } | undefined;
  const [selectedCols, setSelectedCols] = useState<number[]>(
    savedConfig?.cols ?? []
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

  const summaries = useMemo(
    () =>
      selectedCols.map((col) => {
        const sub = getSubHeader(tableId, col);
        return descriptiveSummary(
          getColumnData(tableId, col),
          sub || columnName(col)
        );
      }),
    [selectedCols, tableId, getColumnData, getSubHeader]
  );

  const toggleCol = (col: number) => {
    setSelectedCols((prev) => {
      const next = prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col];
      updateResultData(resultId, { cols: next }, {});
      return next;
    });
  };

  if (!table) {
    return <div className="p-4 text-gray-500">{zh.workspace.tableMissing}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {zh.analysis.descriptiveStatistics} - 选择列
        </h3>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCols.includes(opt.value)}
                onChange={() => toggleCol(opt.value)}
                className="rounded border-gray-300"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {summaries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <td className="py-1 font-semibold text-gray-700">指标</td>
                {summaries.map((s) => (
                  <td
                    key={s.label}
                    className="py-1 px-3 text-right font-semibold text-gray-700"
                  >
                    {s.label}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map(([label, fn]) => (
                <tr key={label} className="border-b border-gray-100">
                  <td className="py-0.5 text-gray-500">{label}</td>
                  {summaries.map((s) => (
                    <td
                      key={s.label}
                      className="py-0.5 px-3 text-right font-mono text-gray-700"
                    >
                      {fn(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400">请选择数据列</p>
      )}
    </div>
  );
};
