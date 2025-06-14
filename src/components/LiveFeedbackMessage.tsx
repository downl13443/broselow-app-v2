
import React from "react";
import { QualityMetrics } from "@/types/camera";

interface LiveFeedbackMessageProps {
  boundingBoxColor: string;
  feedbackMessage: string;
}

const colorBg = {
  "#10B981": "bg-green-100",
  "#F59E0B": "bg-yellow-100",
  "#EF4444": "bg-red-100"
};

const colorText = {
  "#10B981": "text-green-700",
  "#F59E0B": "text-yellow-800",
  "#EF4444": "text-red-700"
};

const LiveFeedbackMessage: React.FC<LiveFeedbackMessageProps> = ({
  boundingBoxColor,
  feedbackMessage,
}) => (
  <div
    className={`text-center p-3 rounded-lg ${colorBg[boundingBoxColor] || "bg-gray-100"} ${colorText[boundingBoxColor] || "text-gray-700"}`}
  >
    <p className="font-medium">{feedbackMessage}</p>
  </div>
);

export default LiveFeedbackMessage;
