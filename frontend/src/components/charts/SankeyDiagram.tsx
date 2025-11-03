/**
 * SankeyDiagram Component - مخطط سانكي لتدفق البيانات
 * مخصص لعرض التدفقات والتحولات في البيانات
 */

import React, { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

interface SankeyNode {
  name: string;
  color?: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  color?: string;
}

interface SankeyDiagramData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyDiagramProps {
  data: SankeyDiagramData;
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colors?: string[];
  nodePadding?: number;
  nodeWidth?: number;
  onNodeClick?: (node: SankeyNode, index: number) => void;
  onLinkClick?: (link: SankeyLink, index: number) => void;
}

const defaultColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', 
  '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
];

const generateFlowData = (sourceName: string, targetName: string, value: number): SankeyDiagramData => ({
  nodes: [
    { name: sourceName },
    { name: targetName }
  ],
  links: [
    { source: 0, target: 1, value }
  ]
});

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  data,
  width,
  height = 400,
  margin = { top: 10, right: 10, bottom: 10, left: 10 },
  colors = defaultColors,
  nodePadding = 20,
  nodeWidth = 20,
  onNodeClick,
  onLinkClick,
}) => {
  const processedData = useMemo(() => {
    return {
      ...data,
      nodes: data.nodes.map((node, index) => ({
        ...node,
        color: node.color || colors[index % colors.length],
      })),
      links: data.links.map((link, index) => ({
        ...link,
        color: link.color || colors[index % colors.length],
        fill: 'none',
        stroke: colors[index % colors.length],
        strokeWidth: Math.max(1, Math.sqrt(link.value / 10)),
      })),
    };
  }, [data, colors]);

  const CustomNode = (props: any) => {
    const { x, y, width, height, index, payload } = props;
    const color = processedData.nodes[index]?.color || colors[index % colors.length];

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          stroke="#fff"
          strokeWidth={2}
          rx={4}
          onClick={() => onNodeClick?.(payload, index)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
        <text
          x={x + width + 5}
          y={y + height / 2}
          dy="0.35em"
          fontSize={12}
          fontWeight="bold"
          fill="#333"
        >
          {payload.name}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">
            {data.source.name} → {data.target.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            القيمة: {data.value.toLocaleString('ar-SA')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: width || '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={processedData}
          margin={margin}
          nodePadding={nodePadding}
          nodeWidth={nodeWidth}
          node={CustomNode}
          link={{
            stroke: (entry: any) => entry.color || colors[0],
            strokeWidth: (entry: any) => Math.max(1, Math.sqrt(entry.value / 10)),
          }}
          iterations={64}
          linkCurve={(entry: any) => {
            const { source, target, value } = entry;
            const scale = Math.sqrt(value / 100);
            return {
              source: {
                x: source.x + source.width,
                y: source.y + source.height / 2,
              },
              target: {
                x: target.x,
                y: target.y + target.height / 2,
              },
              thickness: Math.max(1, scale),
              curvature: 0.5,
            };
          }}
        >
          <Tooltip content={<CustomTooltip />} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
};

// Utility functions for common use cases
export const createFunnelData = (funnelStages: Array<{ name: string; value: number }>): SankeyDiagramData => {
  const nodes = funnelStages.map(stage => ({ name: stage.name }));
  const links: SankeyLink[] = [];

  for (let i = 0; i < funnelStages.length - 1; i++) {
    const currentValue = funnelStages[i].value;
    const nextValue = funnelStages[i + 1].value;
    const flowValue = Math.min(currentValue, nextValue);
    
    links.push({
      source: i,
      target: i + 1,
      value: flowValue,
    });

    // Add dropoff to a "Dropped" node if there's significant loss
    if (currentValue - nextValue > currentValue * 0.1) {
      if (!nodes.find(n => n.name === 'تسرب')) {
        nodes.push({ name: 'تسرب' });
      }
      const dropoffIndex = nodes.length - 1;
      links.push({
        source: i,
        target: dropoffIndex,
        value: currentValue - nextValue,
      });
    }
  }

  return { nodes, links };
};

export const createUserJourneyData = (journeySteps: Array<{ name: string; users: number }>): SankeyDiagramData => {
  const nodes = journeySteps.map(step => ({ name: step.name }));
  const links: SankeyLink[] = [];

  for (let i = 0; i < journeySteps.length - 1; i++) {
    const conversionRate = 0.7 + Math.random() * 0.3; // 70-100% conversion
    const flowValue = Math.floor(journeySteps[i].users * conversionRate);
    
    links.push({
      source: i,
      target: i + 1,
      value: flowValue,
    });

    // Add users who drop off
    const dropoff = journeySteps[i].users - flowValue;
    if (dropoff > 0) {
      if (!nodes.find(n => n.name === 'خرج')) {
        nodes.push({ name: 'خرج' });
      }
      const dropoffIndex = nodes.length - 1;
      links.push({
        source: i,
        target: dropoffIndex,
        value: dropoff,
      });
    }
  }

  return { nodes, links };
};

export const createRevenueFlowData = (channels: Array<{ name: string; revenue: number }>): SankeyDiagramData => {
  const nodes = [
    ...channels.map(channel => ({ name: channel.name })),
    { name: 'إجمالي الإيرادات' }
  ];

  const links: SankeyLink[] = channels.map((channel, index) => ({
    source: index,
    target: channels.length,
    value: channel.revenue,
  }));

  return { nodes, links };
};

export default SankeyDiagram;