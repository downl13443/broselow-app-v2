
import React from "react";
import { QualityMetrics } from "@/types/camera";

interface BoundingBoxOverlayProps {
  qualityMetrics: QualityMetrics;
}

const BOUNDING_BOX_COLORS = {
  excellent: "#10B981", // green
  good: "#F59E0B",      // yellow
  poor: "#EF4444"       // red
};

const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({ qualityMetrics }) => {
  const boundingBoxColor = BOUNDING_BOX_COLORS[qualityMetrics.overallQuality];

  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Guide Frame */}
      <rect
        x="15"
        y="20"
        width="70"
        height="60"
        fill="none"
        stroke={boundingBoxColor}
        strokeWidth="1"
        strokeDasharray={qualityMetrics.overallQuality === "excellent" ? "none" : "2,1"}
        rx="2"
      />
      {/* Center Cross (not shown if excellent) */}
      {qualityMetrics.overallQuality !== "excellent" && (
        <>
          <line
            x1="50"
            y1="25"
            x2="50"
            y2="75"
            stroke={boundingBoxColor}
            strokeWidth="0.5"
            opacity="0.6"
          />
          <line
            x1="20"
            y1="50"
            x2="80"
            y2="50"
            stroke={boundingBoxColor}
            strokeWidth="0.5"
            opacity="0.6"
          />
        </>
      )}
      {/* Indicator dots */}
      <circle
        cx="85"
        cy="15"
        r="2"
        fill={qualityMetrics.isFramed ? '#10B981' : '#EF4444'}
      />
      <circle
        cx="85"
        cy="25"
        r="2"
        fill={qualityMetrics.isCentered ? '#10B981' : '#EF4444'}
      />
      <circle
        cx="85"
        cy="35"
        r="2"
        fill={qualityMetrics.isStable ? '#10B981' : '#EF4444'}
      />
    </svg>
  );
};

export default BoundingBoxOverlay;
