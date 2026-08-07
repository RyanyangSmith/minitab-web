import React, { useMemo, useState } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { normalityTest, type NormalityResult } from '../../../stats/normality';
import { columnName } from '../../../utils/columnName';
import { zh } from '../../../i18n/zh';

interface NormalityTestProps {
  tableId: string;
  resultId: string;
}

export const NormalityTest: React.FC<NormalityTestProps> = ({
  tableId,
  resultId,
}) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getColumnData = useTableStore((s) => s.getColumnData);
  const results = useAnalysisStore((s) => s.results);
  const updateResultData = useAnalysisStore((s) => s.updateResultData);

  const saved = results[resultId];
  const savedConfig = saved?.config as { col?: number } | undefined;
  const savedData = saved?.data as
    | { norm?: NormalityResult | null }
    | undefined;

  const [selectedCol, setSelectedCol] = useState<number | null>(
    savedConfig?.col ?? null
  );
  const [normResult, setNormResult] = useState<NormalityResult | null>(
    savedData?.norm ?? null
  );
  const [message, setMessage] = useState('');

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
    if (selectedCol == null) return;
    const data = getColumnData(tableId, selectedCol);
    if (data.length < 3) {
      setNormResult(null);
      setMessage('样本量不足');
      updateResultData(resultId, { col: selectedCol }, { norm: null });
      return;
    }
    const norm = normalityTest(data);
    setNormResult(norm);
    setMessage('');
    updateResultData(resultId, { col: selectedCol }, { norm });
  };

  if (!table) return <div className="p-4 text-gray-500">{zh.workspace.tableMissing}</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {zh.analysis.normality} - 配置
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-gray-600 w-[80px]">
            {zh.analysis.selectColumn}
          </label>
          <select
            className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
            value={selectedCol ?? ''}
            onChange={(e) =>
              setSelectedCol(e.target.value === '' ? null : Number(e.target.value))
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
            disabled={selectedCol == null}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40 ml-3"
          >
            {zh.analysis.run}
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-amber-700">{message}</p>}

      {normResult && (
        <div className="text-xs">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-1 border border-gray-200 text-left">
                  正态性检验
                </th>
                <th className="px-2 py-1 border border-gray-200 text-right">
                  统计量
                </th>
                <th className="px-2 py-1 border border-gray-200 text-right">
                  P 值
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1 border border-gray-200">
                  Anderson-Darling
                </td>
                <td className="px-2 py-1 border border-gray-200 text-right font-mono">
                  {normResult.ad.statistic.toFixed(4)}
                </td>
                <td className="px-2 py-1 border border-gray-200 text-right font-mono">
                  {normResult.ad.pValue.toFixed(4)}
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1 border border-gray-200">Shapiro-Wilk</td>
                <td className="px-2 py-1 border border-gray-200 text-right font-mono">
                  {normResult.sw.statistic.toFixed(4)}
                </td>
                <td className="px-2 py-1 border border-gray-200 text-right font-mono">
                  {normResult.sw.pValue.toFixed(4)}
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1 border border-gray-200">
                  Kolmogorov-Smirnov（Lilliefors）
                </td>
                <td className="px-2 py-1 border border-gray-200 text-right font-mono">
                  {normResult.ks.statistic.toFixed(4)}
                </td>
                <td className="px-2 py-1 border border-gray-200 text-right font-mono">
                  {normResult.ks.pValue.toFixed(4)}
                </td>
              </tr>
              <tr className="bg-gray-50 font-medium">
                <td className="px-2 py-1 border border-gray-200">
                  N / 均值 / 标准差
                </td>
                <td colSpan={2} className="px-2 py-1 border border-gray-200 text-right font-mono">
                  {normResult.n} / {normResult.mean.toFixed(4)} /{' '}
                  {normResult.stddev.toFixed(4)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
