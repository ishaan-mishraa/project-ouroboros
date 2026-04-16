// client/components/dashboard/dissonance-edge.tsx
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

export default function DissonanceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  // Calculate the curve and the exact center point for the label
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* The Glowing Red SVG Line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#DC3545', // Crimson Red
          strokeWidth: 3,
          strokeDasharray: '5,5', // Creates a dashed tactical line
          filter: 'drop-shadow(0 0 8px rgba(220, 53, 69, 0.8))',
          animation: 'dashdraw 30s linear infinite', // We'll rely on tailwind pulse for now
        }}
        className="animate-pulse"
      />
      
      {/* The Floating HTML Label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all', // Allows the label to be clickable later
          }}
          className="nodrag nopan"
        >
          <div className="bg-[#DC3545]/10 border border-[#DC3545] text-[#DC3545] text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md flex items-center gap-2 shadow-[0_0_15px_rgba(220,53,69,0.4)] tracking-widest uppercase cursor-pointer hover:bg-[#DC3545]/30 transition-colors">
            {/* Pulsing Radar Dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC3545] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC3545]"></span>
            </span>
            CONTRADICTION DETECTED
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}