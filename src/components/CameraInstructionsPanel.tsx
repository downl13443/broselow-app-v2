
import React from "react";
import { CameraInstructions } from "@/types/camera";

interface CameraInstructionsPanelProps {
  instructions: CameraInstructions;
}

const CameraInstructionsPanel: React.FC<CameraInstructionsPanelProps> = ({ instructions }) => (
  <div className="text-center space-y-2">
    <p className="text-blue-700 font-medium">{instructions.instruction}</p>
    <p className="text-sm text-gray-600">{instructions.guidelines}</p>
  </div>
);

export default CameraInstructionsPanel;
