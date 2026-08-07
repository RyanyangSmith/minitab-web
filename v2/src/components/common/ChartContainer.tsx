import React, { useRef } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, BoxplotChart, LineChart, ScatterChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  MarkLineComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([
  BarChart,
  BoxplotChart,
  LineChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  MarkLineComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  SVGRenderer,
]);

interface ChartContainerProps {
  option: EChartsOption;
  height?: number;
  onChartReady?: (chart: unknown) => void;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  option,
  height = 400,
  onChartReady,
}) => {
  const chartRef = useRef<ReactEChartsCore>(null);

  const defaultOption: EChartsOption = {
    toolbox: {
      feature: {
        saveAsImage: { title: '保存图片', name: 'chart' },
        dataZoom: { title: { zoom: '区域缩放', back: '还原' } },
      },
    },
    tooltip: {},
  };

  const mergedOption: EChartsOption = {
    ...defaultOption,
    ...option,
    toolbox: {
      ...defaultOption.toolbox,
      ...(option.toolbox as object),
    },
  };

  return (
    <div className="w-full">
      <ReactEChartsCore
        echarts={echarts}
        ref={chartRef}
        option={mergedOption}
        style={{ height, width: '100%' }}
        notMerge
        opts={{ renderer: 'svg' }}
        onChartReady={onChartReady}
      />
    </div>
  );
};
