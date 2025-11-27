// src/lib/imu-processor.ts
import type { RawRunDataEntry, StepMetrics } from "./types";

// Costanti
const g = 9.80665; // m/s^2

// Funzioni ausiliarie
function toMs(timestamp: string): number {
  return new Date(timestamp).getTime();
}

function magnitude(ax: number, ay: number, az: number): number {
  return Math.sqrt(ax * ax + ay * ay + az * az);
}

function atan2Deg(y: number, x: number): number {
  return Math.atan2(y, x) * 180 / Math.PI;
}

// Main processing
export function processIMUData(jsonData: RawRunDataEntry[], userWeight: number = 75): StepMetrics[] {
  const imuSamples = jsonData.filter(d => d.type === "imu" && d.data);

  if (imuSamples.length < 2) return [];

  const timestamps = imuSamples.map(d => toMs(d.timestamp) / 1000); // in seconds
  // Approssimazione senza orientamento completo, assumendo che 'az' sia principalmente verticale
  const adynZ = imuSamples.map(d => ((d.data.az ?? 0) - 1) * g); 

  // Rilevamento eventi FS/TO (Foot Strike / Toe Off)
  const FS: number[] = [];
  const fsThreshold = 5; // m/s^2, soglia per il picco di foot strike
  const minPeakDistanceSamples = 20; // circa 200ms a 100Hz

  for (let i = 1; i < adynZ.length - 1; i++) {
    const isPeak = adynZ[i] > fsThreshold && adynZ[i] > adynZ[i - 1] && adynZ[i] > adynZ[i + 1];
    if (isPeak) {
        if (FS.length === 0 || (timestamps[i] - FS[FS.length - 1]) > 0.2) {
             FS.push(timestamps[i]);
        }
    }
  }

  // Calcolo metriche passo per passo
  const steps: StepMetrics[] = [];
  if (FS.length < 2) return [];

  for (let i = 0; i < FS.length - 1; i++) {
    const tFS = FS[i];
    const tFS_next = FS[i+1];
    
    const sampleStartIndex = imuSamples.findIndex(s => toMs(s.timestamp)/1000 >= tFS);
    const sampleEndIndex = imuSamples.findIndex(s => toMs(s.timestamp)/1000 >= tFS_next);
    
    if(sampleStartIndex === -1 || sampleEndIndex === -1) continue;

    const segmentAdynZ = adynZ.slice(sampleStartIndex, sampleEndIndex);
    const segmentTimestamps = timestamps.slice(sampleStartIndex, sampleEndIndex);

    // Trova TO come il minimo tra due FS
    let minVal = Infinity;
    let minIndex = -1;
    for(let j=0; j < segmentAdynZ.length; j++) {
        if(segmentAdynZ[j] < minVal) {
            minVal = segmentAdynZ[j];
            minIndex = j;
        }
    }
    const tTO = minIndex !== -1 ? segmentTimestamps[minIndex] : (tFS + tFS_next) / 2;

    const CT = tTO - tFS; // Contact Time
    const FT = tFS_next - tTO; // Flight Time
    const Tstep = tFS_next - tFS; // Step Time
    const cadencePmin = 60 / Tstep;
    
    // Stima della lunghezza del passo usando una formula empirica
    const Li = 2 * Math.sqrt(2 * 1.0 * Math.abs(FT * g)); // h ~ 1m
    const vi = Li / Tstep;

    // Pitch/roll approssimati all'inizio FS
    const imuAtFS = imuSamples[sampleStartIndex];
    const ax = imuAtFS?.data.ax ?? 0;
    const ay = imuAtFS?.data.ay ?? 0;
    const az = imuAtFS?.data.az ?? 0;
    const pitchDeg = atan2Deg(-ax, Math.sqrt(ay * ay + az * az));
    const rollDeg = atan2Deg(ay, az);
    
    // Trova il picco di accelerazione nel segmento
    const apeak = Math.max(...segmentAdynZ);

    steps.push({
      index: i + 1,
      CT: CT > 0 ? CT : 0,
      FT: FT > 0 ? FT : 0,
      Tstep: Tstep,
      cadencePmin: cadencePmin,
      Li: Li,
      vi: vi,
      pitchDeg: pitchDeg,
      rollDeg: rollDeg,
    });
  }

  return steps;
}
