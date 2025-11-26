// src/lib/gait-analysis.ts

import type { RunData, UserProfile } from './types';

// Constants
const GRAVITY = 9.80665; // m/s^2

export interface GaitMetrics {
  totalSteps: number;
  totalDistance: number;
  averageSpeed: number;
  averageCadence: number;
  averageStrideLength: number;
  // Future metrics can be added here
  // contactTime: number;
  // flightTime: number;
}

/**
 * This is a placeholder for a full gait analysis pipeline.
 * Currently, it calculates basic aggregate metrics from pre-processed RunData.
 * A full implementation would involve:
 * 1. IMU data parsing and calibration.
 * 2. Sensor fusion (Kalman/Complementary filter) to get orientation.
 * 3. Gravity removal to get dynamic acceleration.
 * 4. Event detection (Foot-Strike, Toe-Off) using ZUPT or other methods.
 * 5. Integration of acceleration to get velocity and displacement, with drift correction.
 * 6. Calculation of step-by-step metrics.
 */
export function analyzeRunData(
  runData: RunData[],
  userProfile: UserProfile
): GaitMetrics | null {
  if (!runData || runData.length < 2) {
    return null; // Not enough data to analyze
  }

  // Ensure data is sorted by timestamp
  const sortedData = [...runData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const durationSeconds =
    (new Date(sortedData[sortedData.length - 1].timestamp).getTime() -
      new Date(sortedData[0].timestamp).getTime()) /
    1000;

  if (durationSeconds <= 0) {
    return null;
  }

  // For now, we assume the provided RunData has pre-calculated values.
  // A real implementation would calculate these from raw accel/gyro data.

  const totalSteps = sortedData.reduce(
    (max, d) => Math.max(max, d.step_count || 0),
    0
  );
  
  const totalDistance = sortedData.reduce((sum, d) => sum + (d.stride_length || 0), 0);

  const averageSpeed =
    sortedData.reduce((sum, d) => sum + (d.speed || 0), 0) / sortedData.length;

  const averageCadence = (totalSteps / durationSeconds) * 60; // steps per minute

  const averageStrideLength =
    sortedData.reduce((sum, d) => sum + (d.stride_length || 0), 0) /
    sortedData.length;

  return {
    totalSteps: isNaN(totalSteps) ? 0 : totalSteps,
    totalDistance: isNaN(totalDistance) ? 0 : totalDistance,
    averageSpeed: isNaN(averageSpeed) ? 0 : averageSpeed,
    averageCadence: isNaN(averageCadence) ? 0 : averageCadence,
    averageStrideLength: isNaN(averageStrideLength) ? 0 : averageStrideLength,
  };
}
