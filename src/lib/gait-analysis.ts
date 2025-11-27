// src/lib/gait-analysis.ts
import * as quat from "gl-matrix/quat";
import * as vec3 from "gl-matrix/vec3";
import * as mat3 from "gl-matrix/mat3";
import type { ImuSample, GaitAnalysisResult, StepMetric, UserProfile, RawRunDataEntry } from './types';

type Params = { samplingHz: number; mass: number; thresholdFs?: number; TminMs?: number; };

/**
 * normalizeRunData: takes the parsed JSON array (sortedData) and returns ImuSample[]
 * - filters only elements type==='imu'
 * - handles ISO / ms / s timestamps
 * - converts accel: g -> m/s^2 (multiplies if detected in g)
 * - converts gyro: deg/s -> rad/s (if detected in deg/s)
 */
function normalizeRunData(sortedData: RawRunDataEntry[]): ImuSample[] {
  if (!Array.isArray(sortedData)) {
      console.error("Input to normalizeRunData is not an array");
      return [];
  }

  const imuRaw = sortedData.filter(e => e && e.type === "imu" && e.data);

  const toSeconds = (ts: any): number => {
    if (typeof ts === "number") {
      if (ts > 1e12) return ts / 1e9;
      if (ts > 1e9)  return ts / 1000;
      return ts;
    }
    const n = Date.parse(String(ts));
    if (!isNaN(n)) return n / 1000;
    return 0;
  };

  const prelim = imuRaw.map((e) => {
    const d = e.data ?? {};
    return {
      t: toSeconds(e.timestamp ?? (d as any).timestamp ?? null),
      ax: Number(d.ax ?? 0),
      ay: Number(d.ay ?? 0),
      az: Number(d.az ?? 0),
      gx: Number(d.gx ?? 0),
      gy: Number(d.gy ?? 0),
      gz: Number(d.gz ?? 0),
    };
  }).filter(p => p.t > 0);

  if (prelim.length === 0) return [];

  const magAccAvg = prelim.reduce((s,p)=> s + Math.sqrt(p.ax*p.ax + p.ay*p.ay + p.az*p.az), 0) / prelim.length;
  const gyroAvg = prelim.reduce((s,p)=> s + (Math.abs(p.gx) + Math.abs(p.gy) + Math.abs(p.gz)), 0) / (prelim.length * 3);

  const accelInG = magAccAvg > 0.3 && magAccAvg < 5; // Heuristic for g
  const gyroInDeg = gyroAvg > 1; // Heuristic for deg/s

  const G = 9.80665;
  const DEG2RAD = Math.PI / 180;

  const samples: ImuSample[] = prelim.map(p => ({
    t: p.t,
    ax: accelInG ? p.ax * G : p.ax,
    ay: accelInG ? p.ay * G : p.ay,
    az: accelInG ? p.az * G : p.az,
    wx: gyroInDeg ? p.gx * DEG2RAD : p.gx,
    wy: gyroInDeg ? p.gy * DEG2RAD : p.gy,
    wz: gyroInDeg ? p.gz * DEG2RAD : p.gz,
  }));

  samples.sort((a,b) => a.t - b.t);

  return samples;
}


// Helper to get sampling frequency from normalized samples
function getSamplingHz(samples: ImuSample[]): number {
    if (samples.length < 2) return 100; // Default fallback

    const duration = samples[samples.length - 1].t - samples[0].t;
    if (duration <= 0) return 100;

    return Math.round(samples.length / duration);
}

export function analyzeRunData(runData: RawRunDataEntry[], userProfile: UserProfile): GaitAnalysisResult | null {
  if (!runData || runData.length < 10) return null;

  const sortedData = [...runData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const samples = normalizeRunData(sortedData);

  if (samples.length < 10) return null;

  const params: Params = {
    samplingHz: getSamplingHz(samples),
    mass: userProfile.weight || 75
  };

  // --- Start of processing pipeline from user prompt ---

  // 1) Bias calibration: use first 1s of data as static
  const Ncal = Math.min(samples.length, Math.floor(params.samplingHz * 1));
  const bias = { ax:0, ay:0, az:0, wx:0, wy:0, wz:0 };
  for (let i=0; i<Ncal; i++){
    bias.ax += samples[i].ax; bias.ay += samples[i].ay; bias.az += samples[i].az;
    bias.wx += samples[i].wx; bias.wy += samples[i].wy; bias.wz += samples[i].wz;
  }
  for (const k of Object.keys(bias)) (bias as any)[k] = (bias as any)[k] / Ncal;

  // Subtract bias
  const ss: ImuSample[] = samples.map(s => ({
    t: s.t,
    ax: s.ax - bias.ax,
    ay: s.ay - bias.ay,
    az: s.az - bias.az,
    wx: s.wx - bias.wx,
    wy: s.wy - bias.wy,
    wz: s.wz - bias.wz,
  }));

  // 2) Orientation: simple complementary filter -> quaternion per sample
  const quats: number[][] = [];
  let q = quat.create(); // identity
  const alpha = 0.98; // complementary weight for gyro integration
  for (let i=0; i<ss.length; i++){
    const s = ss[i];
    const dt = i===0 ? 1/params.samplingHz : (ss[i].t - ss[i-1].t) || (1/params.samplingHz);
    
    // Gyro integrate to delta quaternion (small-angle)
    const omega = [s.wx, s.wy, s.wz];
    const ang = vec3.length(omega as vec3) * dt;
    let dq = quat.create();
    if (ang > 1e-8) {
      const axis = vec3.create(); vec3.scale(axis, omega as vec3, 1.0 / vec3.length(omega as vec3));
      quat.setAxisAngle(dq, axis, ang);
    } else {
      quat.identity(dq);
    }
    quat.multiply(q, q, dq);
    quat.normalize(q, q);

    // Accel -> gravity vector estimate for correction
    const acc = [s.ax, s.ay, s.az];
    const acc_norm = vec3.length(acc as vec3);
    if (acc_norm > 0.5 * 9.8 && acc_norm < 1.5 * 9.8) { // Plausible gravity magnitude
        const up = vec3.fromValues(0, 0, 1);
        const acc_unit = vec3.normalize(vec3.create(), acc as vec3);
        const q_acc = quat.rotationTo(quat.create(), acc_unit, up);
        quat.slerp(q, q, q_acc, 1 - alpha);
        quat.normalize(q, q);
    }
    quats.push(Array.from(q));
  }

  // 3) Transform accel to global and remove gravity
  const g = 9.80665;
  const a_global: {t:number; ax:number; ay:number; az:number; }[] = [];
  for (let i=0; i<ss.length; i++){
    const s = ss[i];
    const R = mat3.fromQuat(mat3.create(), quats[i] as quat);
    const a_body = [s.ax, s.ay, s.az];
    const ag = vec3.transformMat3(vec3.create(), a_body as vec3, R);
    
    const adyn = { t: s.t, ax: ag[0], ay: ag[1], az: ag[2] - g };
    a_global.push(adyn);
  }

  // 4) Simple smoothing can be added here if needed, skipping for now to keep it direct.
  const a_dyn = a_global;

  // 5) Detect FS/TO using adyn.z peaks and thresholding
  const fsIdxs:number[] = [];
  const thresholdFs = 15; // m/s^2, configurable
  const minPeakDistance = Math.floor(params.samplingHz * 0.3); // min 300ms between steps

  for (let i=1; i<a_dyn.length-1; i++){
    const prev = a_dyn[i-1].az;
    const curr = a_dyn[i].az;
    const next = a_dyn[i+1].az;
    if (curr > prev && curr > next && curr > thresholdFs) {
        if (fsIdxs.length === 0 || (i - fsIdxs[fsIdxs.length - 1]) > minPeakDistance) {
            fsIdxs.push(i);
        }
    }
  }

  const toIdxs:number[] = [];
  for (let k=0; k<fsIdxs.length; k++){
    const start = fsIdxs[k];
    let found = false;
    for (let j=start+1; j<Math.min(a_dyn.length, start + Math.floor(params.samplingHz * 0.8)); j++){
      if (a_dyn[j].az < 2) { // Threshold for toe-off
        toIdxs.push(j);
        found = true;
        break;
      }
    }
    if (!found && start + 5 < a_dyn.length) toIdxs.push(start + 5); // Fallback
  }

  // 6) ZUPT & integrate velocity/position per stride
  const vel = a_dyn.map(_=>({vx:0, vy:0, vz:0}));
  const pos = a_dyn.map(_=>({x:0,y:0,z:0}));
  for (let k=0; k<fsIdxs.length-1; k++){
    const i0 = fsIdxs[k], i1 = fsIdxs[k+1];
    vel[i0] = {vx:0, vy:0, vz:0}; // ZUPT start
    for (let i=i0+1; i<=i1; i++){
      const dt = (a_dyn[i].t - a_dyn[i-1].t) || (1/ params.samplingHz);
      vel[i].vx = vel[i-1].vx + 0.5*(a_dyn[i-1].ax + a_dyn[i].ax)*dt;
      vel[i].vy = vel[i-1].vy + 0.5*(a_dyn[i-1].ay + a_dyn[i].ay)*dt;
      vel[i].vz = vel[i-1].vz + 0.5*(a_dyn[i-1].az + a_dyn[i].az)*dt;
    }
    
    // Linear drift correction
    const vEnd = vel[i1];
    const drift = { vx: vEnd.vx, vy: vEnd.vy, vz: vEnd.vz };
    for (let i=i0; i<=i1; i++){
      const factor = (i-i0)/(i1-i0 || 1);
      vel[i].vx -= drift.vx * factor;
      vel[i].vy -= drift.vy * factor;
      vel[i].vz -= drift.vz * factor;
    }

    // Re-integrate for position
    pos[i0] = {x: pos[i0 > 0 ? i0-1 : 0]?.x || 0, y: pos[i0 > 0 ? i0-1 : 0]?.y || 0, z: pos[i0 > 0 ? i0-1 : 0]?.z || 0}
    for (let i=i0+1; i<=i1; i++){
        const dt = (a_dyn[i].t - a_dyn[i-1].t) || (1/ params.samplingHz);
        pos[i].x = pos[i-1].x + 0.5*(vel[i-1].vx + vel[i].vx)*dt;
        pos[i].y = pos[i-1].y + 0.5*(vel[i-1].vy + vel[i].vy)*dt;
        pos[i].z = pos[i-1].z + 0.5*(vel[i-1].vz + vel[i].vz)*dt;
    }
  }

  // 7) compute per-step metrics
  const steps:StepMetric[] = [];
  for (let k=0; k<fsIdxs.length-1; k++){
    const iFS = fsIdxs[k], iFSnext = fsIdxs[k+1];
    if (iFS >= a_dyn.length || iFSnext >= a_dyn.length) continue;

    const iTO = toIdxs[k] ?? Math.floor((iFS + iFSnext)/2);
    if (iTO >= a_dyn.length) continue;

    const tFS = a_dyn[iFS].t, tTO = a_dyn[iTO].t, tFS2 = a_dyn[iFSnext].t;
    const CT = Math.max(0, tTO - tFS);
    const FT = Math.max(0, tFS2 - tTO);
    const Tstep = Math.max(0.01, tFS2 - tFS);

    const dx = pos[iFSnext].x - pos[iFS].x;
    const dy = pos[iFSnext].y - pos[iFS].y;
    const L = Math.sqrt(dx*dx + dy*dy);
    const vmean = L / Tstep;
    
    let apeak = -Infinity;
    if (iFS < iTO) {
        for (let i=iFS; i<=iTO; i++) if (a_dyn[i].az > apeak) apeak = a_dyn[i].az;
    }
    const Fpeak = params.mass * apeak;
    steps.push({ i:k, tFS, tTO, tFS2, CT, FT, Tstep, L, vmean, apeak, Fpeak });
  }

  // 8) summary
  const totalDistance = steps.reduce((s,st)=>s+st.L,0);
  const totalDuration = (a_dyn.length > 0) ? (a_dyn[a_dyn.length-1].t - a_dyn[0].t) || 1 : 1;
  const summary = {
    nSteps: steps.length,
    totalDistance: totalDistance,
    avgSpeed: totalDistance / totalDuration,
  };

  // Add GPS-like positions back to the original runData
  const originLat = 45.4642;
  const originLng = 9.1900;
  const metersPerDegree = 111320;

  const dataWithPositions = runData.map(entry => {
    if(entry.type === 'imu') {
      const sampleIndex = samples.findIndex(s => s.t === toSeconds(entry.timestamp));
      if(sampleIndex !== -1 && sampleIndex < pos.length) {
        const p = pos[sampleIndex];
        return {
          ...entry,
          position: {
            lat: originLat + p.y / metersPerDegree,
            lng: originLng + p.x / (metersPerDegree * Math.cos(originLat * Math.PI / 180)),
          }
        }
      }
    }
    return entry;
  });


  return { steps, summary, a_dyn, pos, vel, quats, dataWithPositions };
}
