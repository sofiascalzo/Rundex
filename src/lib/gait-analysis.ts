// src/lib/gait-analysis.ts
import * as quat from "gl-matrix/quat";
import * as vec3 from "gl-matrix/vec3";
import * as mat3 from "gl-matrix/mat3";
import type { ImuSample, GaitAnalysisResult, StepMetric, UserProfile } from './types';

type Params = { samplingHz: number; mass: number; thresholdFs?: number; TminMs?: number; };

// Helper to convert raw RunData to ImuSample format for processing
function prepareSamples(runData: any[]): { samples: ImuSample[], samplingHz: number } {
  // Sort by timestamp just in case
  const sortedData = [...runData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  if (sortedData.length < 2) {
    return { samples: [], samplingHz: 0 };
  }

  const startTime = new Date(sortedData[0].timestamp).getTime();
  const endTime = new Date(sortedData[sortedData.length - 1].timestamp).getTime();
  const duration = (endTime - startTime) / 1000;
  const samplingHz = Math.round(sortedData.length / duration);

  const GRAVITY = 9.80665;
  const DEG_TO_RAD = Math.PI / 180;

  const samples: ImuSample[] = sortedData.map(d => {
    // Basic unit detection (very naive)
    const isG = Math.abs(d.accel.z) < 5; // if z is around 1, it's likely in g's
    const isDeg = Math.abs(d.gyro.x) > 10; // if values are large, likely deg/s

    return {
      t: (new Date(d.timestamp).getTime() - startTime) / 1000,
      ax: isG ? d.accel.x * GRAVITY : d.accel.x,
      ay: isG ? d.accel.y * GRAVITY : d.accel.y,
      az: isG ? d.accel.z * GRAVITY : d.accel.z,
      wx: isDeg ? d.gyro.x * DEG_TO_RAD : d.gyro.x,
      wy: isDeg ? d.gyro.y * DEG_TO_RAD : d.gyro.y,
      wz: isDeg ? d.gyro.z * DEG_TO_RAD : d.gyro.z,
    };
  });

  return { samples, samplingHz };
}

export function analyzeRunData(runData: any[], userProfile: UserProfile): GaitAnalysisResult | null {
  if (!runData || runData.length < 10) return null;
  
  const { samples, samplingHz } = prepareSamples(runData);

  if (samples.length === 0) return null;

  const params: Params = {
    samplingHz: samplingHz > 0 ? samplingHz : 100, // Fallback Hz
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
    if (!found) toIdxs.push(start + 5); // Fallback
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
    pos[i0] = {x: pos[i0-1]?.x || 0, y: pos[i0-1]?.y || 0, z: pos[i0-1]?.z || 0}
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
    const iTO = toIdxs[k] ?? Math.floor((iFS + iFSnext)/2);
    const tFS = a_dyn[iFS].t, tTO = a_dyn[iTO]?.t ?? tFS + 0.1, tFS2 = a_dyn[iFSnext].t;
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
  const totalDuration = (a_dyn[a_dyn.length-1].t - a_dyn[0].t) || 1;
  const summary = {
    nSteps: steps.length,
    totalDistance: totalDistance,
    avgSpeed: totalDistance / totalDuration,
  };

  return { steps, summary, a_dyn, pos, vel, quats };
}
