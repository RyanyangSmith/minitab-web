import React, { useMemo, useState } from 'react';
import { useTableStore } from '../../../store/tableStore';
import { useAnalysisStore } from '../../../store/analysisStore';
import { analysisRegistry } from '../../../analysis/registry';
import type {
  TTestResult,
  AnovaResult,
  ChiSquareResult,
} from '../../../stats/hypothesis';
import { columnName } from '../../../utils/columnName';
import { StatisticalTable } from '../../common/StatisticalTable';

interface HypothesisTestProps {
  tableId: string;
  resultId: string;
}

type TestType = 'one-sample' | 'two-sample' | 'paired' | 'anova' | 'chi-square';

const TEST_TYPES: { value: TestType; label: string }[] = [
  { value: 'one-sample', label: '单样本 t' },
  { value: 'two-sample', label: '双样本 t' },
  { value: 'paired', label: '配对 t' },
  { value: 'anova', label: '单因素 ANOVA' },
  { value: 'chi-square', label: '卡方检验' },
];

export const HypothesisTest: React.FC<HypothesisTestProps> = ({
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
        testType?: TestType;
        col1?: number;
        col2?: number;
        groupCol?: number;
        mu0?: number;
      }
    | undefined;
  const savedData = saved?.data as
    | {
        result?: TTestResult | AnovaResult | ChiSquareResult | null;
      }
    | undefined;

  const [testType, setTestType] = useState<TestType>(
    savedConfig?.testType ?? 'one-sample'
  );
  const [col1, setCol1] = useState<number | null>(savedConfig?.col1 ?? null);
  const [col2, setCol2] = useState<number | null>(savedConfig?.col2 ?? null);
  const [groupCol, setGroupCol] = useState<number | null>(
    savedConfig?.groupCol ?? null
  );
  const [mu0, setMu0] = useState(savedConfig?.mu0?.toString() ?? '0');
  const [resultData, setResultData] = useState<
    TTestResult | AnovaResult | ChiSquareResult | null
  >(savedData?.result ?? null);

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
      testType,
      col1,
      col2,
      groupCol,
      mu0: mu0 === '' ? 0 : Number(mu0),
    };
    const output = analysisRegistry['hypothesis-test'].run(tableId, config);
    const result = output.data.result as
      | TTestResult
      | AnovaResult
      | ChiSquareResult
      | null;
    setResultData(result);
    updateResultData(resultId, output.config, output.data);
  };

  if (!table) return <div className="p-4 text-gray-500">工作表不存在</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">假设检验 - 配置</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-gray-600 w-[80px]">检验类型</label>
          <select
            className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
            value={testType}
            onChange={(e) => setTestType(e.target.value as TestType)}
          >
            {TEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
            {testType === 'one-sample'
              ? '数据列'
              : testType === 'anova'
                ? '值列'
                : '列 1'}
          </label>
          <select
            className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
            value={col1 ?? ''}
            onChange={(e) =>
              setCol1(e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">请选择...</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {(testType === 'two-sample' || testType === 'paired') && (
            <>
              <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
                列 2
              </label>
              <select
                className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                value={col2 ?? ''}
                onChange={(e) =>
                  setCol2(e.target.value === '' ? null : Number(e.target.value))
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

          {testType === 'chi-square' && (
            <>
              <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
                列 2
              </label>
              <select
                className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                value={col2 ?? ''}
                onChange={(e) =>
                  setCol2(e.target.value === '' ? null : Number(e.target.value))
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

          {testType === 'anova' && (
            <>
              <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
                分组列
              </label>
              <select
                className="min-w-[140px] px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                value={groupCol ?? ''}
                onChange={(e) =>
                  setGroupCol(e.target.value === '' ? null : Number(e.target.value))
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

          {testType === 'one-sample' && (
            <>
              <label className="text-sm font-medium text-gray-600 w-[80px] ml-3">
                H0 均值
              </label>
              <input
                className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
                type="number"
                value={mu0}
                onChange={(e) => setMu0(e.target.value)}
              />
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

      {resultData && (
        <div className="space-y-3">
          {isTTest(resultData) && (
            <StatisticalTable
              title="t 检验结果"
              columns={[
                { key: 'label', label: '项目' },
                { key: 'value', label: '值' },
              ]}
              data={[
                { label: '检验统计量', value: resultData.statistic.toFixed(4) },
                { label: '自由度', value: resultData.df.toFixed(2) },
                { label: 'P 值', value: resultData.pValue.toFixed(6) },
                { label: '95% CI 下限', value: resultData.ciLower.toFixed(4) },
                { label: '95% CI 上限', value: resultData.ciUpper.toFixed(4) },
                { label: '均值 1', value: resultData.mean1.toFixed(4) },
                ...(resultData.mean2 != null
                  ? [{ label: '均值 2', value: resultData.mean2.toFixed(4) }]
                  : []),
              ]}
            />
          )}

          {isAnova(resultData) && (
            <>
              <StatisticalTable
                title="组统计"
                columns={[
                  { key: 'name', label: '组' },
                  { key: 'n', label: 'N' },
                  { key: 'mean', label: '均值' },
                  { key: 'stddev', label: '标准差' },
                ]}
                data={resultData.groups.map((g) => ({
                  name: g.name,
                  n: g.n,
                  mean: g.mean.toFixed(4),
                  stddev: g.stddev.toFixed(4),
                }))}
              />
              <StatisticalTable
                title="ANOVA"
                columns={[
                  { key: 'label', label: '项目' },
                  { key: 'value', label: '值' },
                ]}
                data={[
                  { label: 'F 值', value: resultData.fValue.toFixed(4) },
                  { label: '自由度', value: `${resultData.dfBetween}/${resultData.dfWithin}` },
                  { label: 'P 值', value: resultData.pValue.toFixed(6) },
                  { label: 'SS 组间', value: resultData.ssBetween.toFixed(4) },
                  { label: 'SS 组内', value: resultData.ssWithin.toFixed(4) },
                ]}
              />
            </>
          )}

          {isChiSquare(resultData) && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 pr-3 font-semibold text-gray-700">行 \\ 列</td>
                      {resultData.cols.map((c) => (
                        <td key={c} className="py-1 px-3 text-right font-semibold text-gray-700">
                          {c}
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultData.rows.map((r, ri) => (
                      <tr key={r} className="border-b border-gray-100">
                        <td className="py-0.5 pr-3 text-gray-500">{r}</td>
                        {resultData.cols.map((c, ci) => (
                          <td key={c} className="py-0.5 px-3 text-right font-mono text-gray-700">
                            {resultData.observed[ri][ci]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <StatisticalTable
                title="卡方检验"
                columns={[
                  { key: 'label', label: '项目' },
                  { key: 'value', label: '值' },
                ]}
                data={[
                  { label: '卡方统计量', value: resultData.chiSquare.toFixed(4) },
                  { label: '自由度', value: resultData.df },
                  { label: 'P 值', value: resultData.pValue.toFixed(6) },
                ]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function isTTest(value: unknown): value is TTestResult {
  return (value as TTestResult).test !== undefined;
}

function isAnova(value: unknown): value is AnovaResult {
  return (value as AnovaResult).fValue !== undefined;
}

function isChiSquare(value: unknown): value is ChiSquareResult {
  return (value as ChiSquareResult).chiSquare !== undefined;
}
