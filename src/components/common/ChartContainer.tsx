import React, { useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

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
  const chartRef = useRef<ReactECharts>(null);

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
      <ReactECharts
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
