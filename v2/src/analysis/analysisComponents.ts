import { lazy } from 'react';
import type { ComponentType } from 'react';
import type { AnalysisType } from '../types';

export interface AnalysisComponentProps {
  tableId: string;
  resultId: string;
}

export const analysisComponents: Record<
  AnalysisType,
  ComponentType<AnalysisComponentProps>
> = {
  'capability-analysis': lazy(() =>
    import('../components/analysis/CapabilityAnalysis/CapabilityAnalysis').then(
      (m) => ({ default: m.CapabilityAnalysis })
    )
  ),
  'normality-test': lazy(() =>
    import('../components/analysis/NormalityTest/NormalityTest').then(
      (m) => ({ default: m.NormalityTest })
    )
  ),
  'linear-regression': lazy(() =>
    import('../components/analysis/LinearRegression/LinearRegression').then(
      (m) => ({ default: m.LinearRegression })
    )
  ),
  'scatter-plot': lazy(() =>
    import('../components/analysis/ScatterPlot/ScatterPlot').then(
      (m) => ({ default: m.ScatterPlot })
    )
  ),
  'box-plot': lazy(() =>
    import('../components/analysis/BoxPlot/BoxPlot').then(
      (m) => ({ default: m.BoxPlotView })
    )
  ),
  'pareto-chart': lazy(() =>
    import('../components/analysis/ParetoChart/ParetoChart').then(
      (m) => ({ default: m.ParetoChart })
    )
  ),
  'descriptive-statistics': lazy(() =>
    import('../components/analysis/DescriptiveStatistics/DescriptiveStatistics').then(
      (m) => ({ default: m.DescriptiveStatistics })
    )
  ),
  'spc-control-chart': lazy(() =>
    import('../components/analysis/SpcControlChart/SpcControlChart').then(
      (m) => ({ default: m.SpcControlChart })
    )
  ),
  'hypothesis-test': lazy(() =>
    import('../components/analysis/HypothesisTest/HypothesisTest').then(
      (m) => ({ default: m.HypothesisTest })
    )
  ),
  'gage-rr': lazy(() =>
    import('../components/analysis/GageRR/GageRR').then(
      (m) => ({ default: m.GageRR })
    )
  ),
};
