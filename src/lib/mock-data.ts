import type { RunData } from './types';

// Mock data now includes GPS positions
export const mockRunData: RunData[] = [
  { "timestamp": "2025-11-05T14:30:00Z", "speed": 4.5, "step_count": 1200, "stride_length": 1.15, "posture_error": 3.0, "position": { "lat": 45.4642, "lng": 9.1900 } },
  { "timestamp": "2025-11-05T14:30:10Z", "speed": 4.6, "step_count": 1203, "stride_length": 1.16, "posture_error": 2.9, "position": { "lat": 45.4643, "lng": 9.1902 } },
  { "timestamp": "2025-11-05T14:30:20Z", "speed": 4.55, "step_count": 1206, "stride_length": 1.15, "posture_error": 3.1, "position": { "lat": 45.4644, "lng": 9.1904 } },
  { "timestamp": "2025-11-05T14:30:30Z", "speed": 4.7, "step_count": 1209, "stride_length": 1.17, "posture_error": 2.8, "position": { "lat": 45.4645, "lng": 9.1906 } },
  { "timestamp": "2025-11-05T14:30:40Z", "speed": 4.75, "step_count": 1212, "stride_length": 1.18, "posture_error": 2.7, "position": { "lat": 45.4646, "lng": 9.1908 } },
  { "timestamp": "2025-11-05T14:30:50Z", "speed": 4.8, "step_count": 1215, "stride_length": 1.18, "posture_error": 2.6, "position": { "lat": 45.4647, "lng": 9.1910 } },
  { "timestamp": "2025-11-05T14:31:00Z", "speed": 4.8, "step_count": 1220, "stride_length": 1.18, "posture_error": 2.6, "position": { "lat": 45.4648, "lng": 9.1912 } },
  { "timestamp": "2025-11-05T14:31:10Z", "speed": 4.85, "step_count": 1224, "stride_length": 1.19, "posture_error": 2.5, "position": { "lat": 45.4649, "lng": 9.1914 } },
  { "timestamp": "2025-11-05T14:31:20Z", "speed": 4.9, "step_count": 1228, "stride_length": 1.2, "posture_error": 2.4, "position": { "lat": 45.4650, "lng": 9.1916 } },
  { "timestamp": "2025-11-05T14:31:30Z", "speed": 4.95, "step_count": 1232, "stride_length": 1.21, "posture_error": 2.3, "position": { "lat": 45.4651, "lng": 9.1918 } },
  { "timestamp": "2025-11-05T14:31:40Z", "speed": 5.0, "step_count": 1236, "stride_length": 1.22, "posture_error": 2.2, "position": { "lat": 45.4652, "lng": 9.1920 } },
  { "timestamp": "2025-11-05T14:31:50Z", "speed": 4.9, "step_count": 1239, "stride_length": 1.2, "posture_error": 2.4, "position": { "lat": 45.4653, "lng": 9.1922 } },
  { "timestamp": "2025-11-05T14:32:00Z", "speed": 4.9, "step_count": 1243, "stride_length": 1.2, "posture_error": 2.4, "position": { "lat": 45.4654, "lng": 9.1924 } },
  { "timestamp": "2025-11-05T14:32:10Z", "speed": 4.8, "step_count": 1247, "stride_length": 1.18, "posture_error": 2.6, "position": { "lat": 45.4655, "lng": 9.1926 } },
  { "timestamp": "2025-11-05T14:32:20Z", "speed": 4.7, "step_count": 1251, "stride_length": 1.17, "posture_error": 2.8, "position": { "lat": 45.4656, "lng": 9.1928 } },
];
