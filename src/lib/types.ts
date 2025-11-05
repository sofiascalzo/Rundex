export interface RunData {
  timestamp: string;
  accel?: { x: number; y: number; z: number };
  gyro?: { x: number; y: number; z: number };
  speed: number;
  stride_length: number;
  step_count: number;
  posture_error: number;
  run_phase?: string;
}
