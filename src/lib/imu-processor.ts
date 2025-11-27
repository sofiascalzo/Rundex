// src/lib/imu-processor.ts
import type { RawRunDataEntry, StepMetrics } from "./types";

// Costanti
const g = 9.80665; // m/s^2
const mass = 70; // kg, esempio
const fsThreshold = 2; // soglia accelerazione verticale dinamica per FS/TO (m/s²)
const samplingInterval = 0.025; // esempio 40 Hz ~ 25 ms

// Funzioni ausiliarie
function toMs(timestamp: string): number {
  return new Date(timestamp).getTime() / 1000; // s
}

function magnitude(ax: number, ay: number, az: number): number {
  return Math.sqrt(ax * ax + ay * ay + az * az);
}

function atan2Deg(y: number, x: number): number {
  return Math.atan2(y, x) * 180 / Math.PI;
}

// Main processing
export function processIMUData(jsonData: RawRunDataEntry[]): StepMetrics[] {
  const imuSamples = jsonData.filter(d => d.type === "imu" && d.data);
  
  if (imuSamples.length === 0) return [];

  const timestamps = imuSamples.map(d => toMs(d.timestamp));
  // Assumes g-force unit, converts to m/s^2 and removes gravity
  const adynZ = imuSamples.map(d => ((d.data.az ?? 0) * g) - g); 

  // Rilevamento eventi FS/TO
  const FS: number[] = [];
  const TO: number[] = [];

  for (let i = 1; i < adynZ.length - 1; i++) {
    if (adynZ[i] > fsThreshold && adynZ[i] > adynZ[i - 1] && adynZ[i] > adynZ[i + 1]) {
      // Check for minimal distance between peaks
      if (FS.length === 0 || (timestamps[i] - FS[FS.length - 1] > 0.25)) { // min 250ms between steps
          FS.push(timestamps[i]);
      }
    }
    if (adynZ[i] < -fsThreshold && adynZ[i] < adynZ[i - 1] && adynZ[i] < adynZ[i + 1]) { // Using negative threshold for TO
       if (TO.length === 0 || (timestamps[i] - TO[TO.length - 1] > 0.25)) {
          TO.push(timestamps[i]);
       }
    }
  }

  // Calcolo metriche passo per passo
  const steps: StepMetrics[] = [];
  let cumulDist = 0;

  for (let i = 0; i < FS.length - 1; i++) {
    const tFS = FS[i];
    const tFS_next = FS[i+1];
    const tTO = TO.find(t => t > tFS && t < tFS_next) ?? (tFS + (tFS_next - tFS) / 2); // fallback to midpoint
    
    const CT = tTO - tFS;
    const FT = tFS_next - tTO;
    const Tstep = tFS_next - tFS;

    if (Tstep <= 0) continue;

    const cadenceHz = 1 / Tstep;
    const cadencePmin = cadenceHz * 60;

    // Lunghezza passo tramite integrazione semplice verticale (approssimazione)
    const Li = 0.5; // placeholder, sostituire con integrazione ZUPT
    cumulDist += Li;

    // Pitch/roll approssimati all'inizio FS
    const imuStart = imuSamples.find(s => toMs(s.timestamp) >= tFS);
    const ax = imuStart?.data.ax ?? 0;
    const ay = imuStart?.data.ay ?? 0;
    const az = imuStart?.data.az ?? 0;
    const pitchDeg = atan2Deg(-ax, Math.sqrt(ay * ay + az * az));
    const rollDeg = atan2Deg(ay, az);

    // Picco accelerazione verticale e forza
    const startIndex = imuSamples.findIndex(s => toMs(s.timestamp) >= tFS);
    const endIndex = imuSamples.findIndex(s => toMs(s.timestamp) >= tFS_next);
    const segment = adynZ.slice(startIndex, endIndex);
    const apeak = segment.length > 0 ? Math.max(...segment) : 0;
    const Fpeak = mass * apeak;

    // Velocità media (approssimazione)
    const vi = Li / Tstep;

    steps.push({
      index: i + 1,
      tFS,
      tTO,
      CT: CT > 0 ? CT : 0,
      FT: FT > 0 ? FT : 0,
      Tstep,
      cadenceHz,
      cadencePmin,
      Li,
      vi,
      pitchDeg,
      rollDeg,
      apeak,
      Fpeak,
      cumulDist,
    });
  }

  return steps;
}
