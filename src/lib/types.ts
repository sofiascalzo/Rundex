export interface ImuSample {
  t: number;  // timestamp in seconds
  ax: number; // m/s^2
  ay: number; // m/s^2
  az: number; // m/s^2
  wx: number; // rad/s
  wy: number; // rad/s
  wz: number; // rad/s
}

export interface RunData {
  timestamp: string; // ISO string
  accel?: { x: number; y: number; z: number; };
  gyro?: { x: number; y: number; z: number; };
  speed?: number;
  stride_length?: number;
  step_count?: number;
  posture_error?: number;
  position?: { lat: number; lng: number; };
}

// Type for raw data coming from BLE or file upload
export interface RawRunDataEntry {
    timestamp: string;
    type: 'imu' | 'counter' | string;
    data: {
      ax?: number;
      ay?: number;
      az?: number;
      gx?: number;
      gy?: number;
      gz?: number;
      count?: number;
    };
    position?: { lat: number; lng: number };
}


export interface UserProfile {
  nickname: string;
  avatarUrl: string;
  weight: number;
}


// --- GAIT ANALYSIS TYPES ---

export interface StepMetric {
  i: number;
  tFS: number;
  tTO: number;
  tFS2: number;
  CT: number;
  FT: number;
  Tstep: number;
  L: number;
  vmean: number;
  apeak: number;
  Fpeak: number;
}

export interface GaitAnalysisSummary {
  nSteps: number;
  totalDistance: number;
  avgSpeed: number;
}

export interface GaitAnalysisResult {
  steps: StepMetric[];
  summary: GaitAnalysisSummary;
  a_dyn: { t: number; ax: number; ay: number; az: number; }[];
  pos: { x: number; y: number; z: number; }[];
  vel: { vx: number; vy: number; vz: number; }[];
  quats: number[][];
  dataWithPositions?: RawRunDataEntry[];
}
