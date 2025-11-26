export interface ImuSample {
  x: number;
  y: number;
  z: number;
}

export interface RunData {
  timestamp: string;
  accel?: ImuSample;
  gyro?: ImuSample;
  speed: number;
  stride_length: number;
  step_count: number;
  posture_error: number;
  run_phase?: string; // e.g., 'stance', 'swing'
}

export interface UserProfile {
  nickname: string;
  avatarUrl: string;
  weight: number;
}
