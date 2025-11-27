
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bluetooth, BluetoothConnected, Lightbulb, LightbulbOff, Activity, Bot, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { useRunData } from "@/context/run-data-context";
import type { RawRunDataEntry } from "@/lib/types";

// UUIDs from the Arduino sketch
const SERVICE_UUID = '19b10000-e8f2-537e-4f6c-d104768a1214';
const LED_CHAR_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
const COUNTER_UUID = '19b10004-e8f2-537e-4f6c-d104768a1214';
const IMU_CHAR_UUID = '19b10005-e8f2-537e-4f6c-d104768a1214';

// IMU Visualization constants
const MAX_ACC = 4.0; // Max acceleration range in g

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ImuData {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
}

const AxisBar = ({ value, label }: { value: number, label: string }) => {
    const clamped = Math.max(-MAX_ACC, Math.min(MAX_ACC, value));
    const ratio = Math.abs(clamped) / MAX_ACC;
    const offset = ratio * 50; // max 50%
    const left = clamped >= 0 ? 50 : 50 - offset;
  
    return (
      <div className="flex items-center gap-2 mb-2">
        <span className="w-4 font-bold text-sm">{label}</span>
        <div className="relative flex-1 h-3 bg-secondary rounded-full overflow-hidden">
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-muted-foreground/50" />
          <div
            className="absolute top-0 bottom-0 h-full rounded-full"
            style={{
              left: `${left}%`,
              width: `${offset}%`,
              backgroundColor: clamped >= 0 ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
            }}
          />
        </div>
        <span className="w-20 text-right font-mono text-sm text-muted-foreground">{value.toFixed(3)}</span>
      </div>
    );
};
  
const XYPlot = ({ ax, ay }: { ax: number, ay: number }) => {
    const rMax = 70; // Usable radius
    const mag = Math.sqrt(ax * ax + ay * ay);
    const norm = Math.min(mag / MAX_ACC, 1.0);
    const r = norm * rMax;
    const angle = mag < 1e-3 ? 0 : Math.atan2(ay, ax);
  
    const x2 = 90 + r * Math.cos(angle);
    const y2 = 90 - r * Math.sin(angle); // Y is inverted in SVG
  
    return (
        <div className="flex flex-col items-center">
            <svg width="180" height="180" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="80" stroke="hsl(var(--border))" strokeWidth="2" fill="hsl(var(--card))" />
                <line x1="10" y1="90" x2="170" y2="90" stroke="hsl(var(--border))" strokeWidth="1" />
                <line x1="90" y1="10" x2="90" y2="170" stroke="hsl(var(--border))" strokeWidth="1" />
                <line x1="90" y1="90" x2={x2} y2={y2} stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
                <circle cx="90" cy="90" r="3" fill="hsl(var(--foreground))" />
            </svg>
            <p className="text-xs text-muted-foreground mt-2">XY Plane (Top-down view)</p>
        </div>
    );
};


export default function BluetoothConnect() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const { toast } = useToast();
  const { setRunData } = useRunData();

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const ledCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const sessionDataRef = useRef<RawRunDataEntry[]>([]);

  const [ledState, setLedState] = useState<boolean | null>(null);
  const [counter, setCounter] = useState<number | null>(null);
  const [imuData, setImuData] = useState<ImuData | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLog(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev]);
  };
  
  const saveSessionData = () => {
    if (sessionDataRef.current.length === 0) {
      addLog('No session data to save.');
      return;
    }

    // Save to global context
    setRunData(sessionDataRef.current);
    addLog(`Session data with ${sessionDataRef.current.length} points saved to the app.`);

    // Also download a backup file
    const dataStr = JSON.stringify(sessionDataRef.current, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = format(new Date(), "yyyy-MM-dd'T'HH_mm_ss");
    a.download = `rundex_session_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog(`Backup session data saved to ${a.download}`);
    toast({
        title: "Session Saved",
        description: `Data saved to app and a backup file was downloaded.`,
        action: <Download className="h-5 w-5" />
    });
  };

  const resetState = () => {
    setDeviceName(null);
    setStatus("disconnected");
    setLedState(null);
    setCounter(null);
    setImuData(null);
    deviceRef.current = null;
    ledCharRef.current = null;
    sessionDataRef.current = [];
  }

  const handleDisconnect = () => {
    addLog('❌ Disconnected from device.');
    saveSessionData();
    resetState();
    toast({
        title: "Device Disconnected",
        description: "The Bluetooth device has been disconnected and session data was saved.",
    });
  }
  
  const handleImuNotification = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value || target.value.byteLength < 24) {
      addLog('Invalid IMU data received');
      return;
    }
    const v = target.value;
    const data: ImuData = {
      ax: v.getFloat32(0, true),
      ay: v.getFloat32(4, true),
      az: v.getFloat32(8, true),
      gx: v.getFloat32(12, true),
      gy: v.getFloat32(16, true),
      gz: v.getFloat32(20, true),
    };
    setImuData(data);
    
    sessionDataRef.current.push({
      timestamp: new Date().toISOString(),
      type: 'imu',
      data: data
    });

    // Reduce log spam
    // addLog(
    //     'IMU: ' +
    //     'ax=' + data.ax.toFixed(3) + ' ' +
    //     'ay=' + data.ay.toFixed(3) + ' ' +
    //     'az=' + data.az.toFixed(3) + ' | ' +
    //     'gx=' + data.gx.toFixed(3) + ' ' +
    //     'gy=' + data.gy.toFixed(3) + ' ' +
    //     'gz=' + data.gz.toFixed(3)
    // );
  }

  const handleCounterNotification = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
    if (value.byteLength < 4) {
      addLog('Counter notification too short');
      return;
    }
    const count = value.getUint32(0, true);
    setCounter(count);
    
    sessionDataRef.current.push({
        timestamp: new Date().toISOString(),
        type: 'counter',
        data: { count }
    });

    addLog(`Counter notification: ${count}`);
  };

  const handleLedNotification = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
    const isOn = value.getUint8(0) !== 0;
    setLedState(isOn);
    addLog(`LED notification: ${isOn ? 'ON' : 'OFF'}`);
  };


  const handleConnect = async () => {
    if (!navigator.bluetooth) {
      toast({
        title: "Bluetooth Not Supported",
        description: "Please use a compatible browser and ensure you are in a secure context (HTTPS).",
        variant: "destructive",
      });
      return;
    }

    setStatus("connecting");
    addLog("Requesting Bluetooth device...");
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'XIAO' }],
        optionalServices: [SERVICE_UUID]
      });
      
      deviceRef.current = device;
      const deviceId = device.name || device.id;
      addLog(`Device chosen: ${deviceId}`);
      setDeviceName(deviceId);

      device.addEventListener('gattserverdisconnected', handleDisconnect);

      addLog('Connecting to GATT Server...');
      const server = await device.gatt.connect();
      setStatus("connected");
      addLog('✅ GATT Server connected.');
      sessionDataRef.current = []; // Reset session data on new connection
      
      toast({
        title: "Device Connected",
        description: `Successfully connected to ${deviceId}.`,
      });

      addLog('Getting primary service...');
      const service = await server.getPrimaryService(SERVICE_UUID);

      addLog('Getting characteristics...');
      const ledChar = await service.getCharacteristic(LED_CHAR_UUID);
      const counterChar = await service.getCharacteristic(COUNTER_UUID);
      const imuChar = await service.getCharacteristic(IMU_CHAR_UUID);
      ledCharRef.current = ledChar;

      // Read initial values
      const initialLed = await ledChar.readValue();
      setLedState(initialLed.getUint8(0) !== 0);
      addLog(`Initial LED state: ${initialLed.getUint8(0) !== 0 ? 'ON' : 'OFF'}`);

      const initialCounter = await counterChar.readValue();
      setCounter(initialCounter.getUint32(0, true));
      addLog(`Initial counter: ${initialCounter.getUint32(0, true)}`);

      // Start notifications
      await ledChar.startNotifications();
      ledChar.addEventListener('characteristicvaluechanged', handleLedNotification);

      await counterChar.startNotifications();
      counterChar.addEventListener('characteristicvaluechanged', handleCounterNotification);

      await imuChar.startNotifications();
      imuChar.addEventListener('characteristicvaluechanged', handleImuNotification);

      addLog('✅ Ready for real-time data.');

    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      setStatus("error");
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect. Check console for details.",
        variant: "destructive",
      });
      setTimeout(() => setStatus("disconnected"), 3000);
    }
  };

  const setLed = async (on: boolean) => {
    if (!ledCharRef.current) {
        addLog("LED characteristic not available.");
        return;
    }
    try {
        const data = new Uint8Array([on ? 1 : 0]);
        await ledCharRef.current.writeValue(data);
        addLog(`Sent LED command: ${on ? 'ON' : 'OFF'}`);
    } catch (error: any) {
        addLog(`LED write error: ${error.message}`);
        toast({ title: "LED Error", description: "Failed to control LED.", variant: "destructive" });
    }
  }
  

  const isConnected = status === "connected";

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Bluetooth Connection</CardTitle>
        <CardDescription>Connect to your XIAO BLE sensor to stream live motion data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex flex-wrap items-center gap-4">
            <Button onClick={handleConnect} disabled={isConnected || status === 'connecting'} size="lg">
                {status === 'connecting' ? 'Connecting...' : 'Connect to XIAO'}
                <Bluetooth className="ml-2 h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
                <Button onClick={() => setLed(true)} disabled={!isConnected} variant="outline">
                    <Lightbulb className="mr-2"/> On
                </Button>
                <Button onClick={() => setLed(false)} disabled={!isConnected} variant="outline">
                    <LightbulbOff className="mr-2"/> Off
                </Button>
            </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 border rounded-lg p-4">
            <div className="flex items-center gap-3">
                <BluetoothConnected className="text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-accent text-accent-foreground" : ""}>
                        {status}
                    </Badge>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Lightbulb className="text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">LED</p>
                    <p className="font-semibold">
                        {ledState === null ? 'Unknown' : (ledState ? 'ON' : 'OFF')}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Bot className="text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Counter</p>
                    <p className="font-semibold">{counter ?? '-'}</p>
                </div>
            </div>
        </div>

        {isConnected && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Activity /> IMU Data</CardTitle>
                </CardHeader>
                <CardContent>
                {imuData ? (
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        <div>
                            <AxisBar label="X" value={imuData.ax} />
                            <AxisBar label="Y" value={imuData.ay} />
                            <AxisBar label="Z" value={imuData.az} />
                        </div>
                        <div className="flex justify-center">
                            <XYPlot ax={imuData.ax} ay={imuData.ay} />
                        </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">Waiting for IMU data...</p>
                )}
                </CardContent>
            </Card>
        )}
      
        <div>
            <h3 className="font-semibold mb-2">Log</h3>
            <ScrollArea className="h-48 w-full rounded-md border p-3 bg-muted/50">
                {log.map((entry, i) => (
                    <p key={i} className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                        {entry}
                    </p>
                ))}
                {log.length === 0 && <p className="text-xs text-muted-foreground">Log is empty.</p>}
            </ScrollArea>
        </div>

      </CardContent>
      {isConnected && (
        <CardFooter>
            <Button variant="destructive" onClick={() => deviceRef.current?.gatt?.disconnect()}>Disconnect</Button>
        </CardFooter>
      )}
    </Card>
  );
}

    

    