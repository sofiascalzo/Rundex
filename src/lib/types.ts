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

export interface StepMetrics {
  index: number;
  tFS: number;
  tTO: number;
  CT: number;       // Contact Time (s)
  FT: number;       // Flight Time (s)
  Tstep: number;    // Step Duration (s)
  cadenceHz: number;
  cadencePmin: number; // Cadence (steps/min)
  Li: number;       // Step Length (m)
  vi: number;       // Step Speed (m/s)
  pitchDeg: number; // Pitch angle at foot strike (degrees)
  rollDeg: number;  // Roll angle at foot strike (degrees)
  apeak: number;
  Fpeak: number;
  cumulDist: number;
}
