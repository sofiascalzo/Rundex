
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bluetooth, BluetoothConnected, BluetoothSearching, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error" | "unsupported";

type DiagnosticInfo = {
  ua: string;
  isSecureContext: boolean;
  inIframe: boolean;
  hasBluetooth: boolean;
  permissionState: string;
};

export default function BluetoothConnect() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<string[]>([]);

  const { toast } = useToast();

  const addLog = (message: string) => {
    console.log(message);
    logRef.current = [...logRef.current, message];
    setLog(logRef.current);
  };

  useEffect(() => {
    const runDiagnostics = async () => {
      const ua = navigator.userAgent;
      const isSecureContext = window.isSecureContext;
      const inIframe = window.self !== window.top;
      const hasBluetooth = !!navigator.bluetooth;

      addLog('userAgent: ' + ua);
      addLog('isSecureContext: ' + isSecureContext);
      addLog('inIframe (self!==top): ' + inIframe);
      addLog('navigator.bluetooth present: ' + hasBluetooth);

      let permissionState = 'unknown';
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const p = await navigator.permissions.query({ name: 'bluetooth' as PermissionName });
          permissionState = p.state;
          addLog('navigator.permissions.query bluetooth -> ' + permissionState);
        } catch (e: any) {
          permissionState = 'error';
          addLog('permissions.query error: ' + e.toString());
        }
      } else {
        permissionState = 'not_supported';
        addLog('navigator.permissions.query not available in this browser');
      }

      setDiagnostics({ ua, isSecureContext, inIframe, hasBluetooth, permissionState });
      
      if (!hasBluetooth || !isSecureContext) {
        setStatus("unsupported");
      }
    };

    runDiagnostics();
  }, []);

  const handleConnect = async () => {
    if (!diagnostics?.hasBluetooth) {
      toast({
        title: "Bluetooth Not Supported",
        description: "Please check the diagnostic information for details.",
        variant: "destructive",
      });
      return;
    }

    setStatus("connecting");
    addLog("Requesting Bluetooth device...");
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access']
      });
      
      const deviceId = device.name || device.id;
      addLog('Device chosen: ' + deviceId);
      setDeviceName(deviceId);
      setStatus("connected");
      
      toast({
        title: "Device Connected",
        description: `Successfully connected to ${deviceId}.`,
      });

      device.addEventListener('gattserverdisconnected', () => {
        addLog(`Device ${deviceId} disconnected.`);
        setStatus("disconnected");
        setDeviceName(null);
        toast({
          title: "Device Disconnected",
          description: "The Bluetooth device has been disconnected.",
        });
      });

    } catch (error: any) {
      addLog('requestDevice error: ' + error.toString());
      if (error.name === 'NotFoundError' || error.name === 'NotAllowedError') {
        addLog('Note: The user may have cancelled the prompt or the context does not allow pairing.');
        setStatus("disconnected");
      } else {
        setStatus("error");
        setTimeout(() => setStatus("disconnected"), 3000);
        toast({
          title: "Connection Failed",
          description: "Could not connect to the Bluetooth device. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const renderStatus = () => {
    switch (status) {
      case "connecting":
        return {
          icon: <BluetoothSearching className="h-6 w-6 animate-pulse text-primary" />,
          text: "Searching for devices...",
          buttonIcon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
          buttonText: "Connecting...",
          disabled: true,
        };
      case "connected":
        return {
          icon: <BluetoothConnected className="h-6 w-6 text-accent" />,
          text: `Connected to ${deviceName}`,
          buttonIcon: <BluetoothConnected className="mr-2 h-4 w-4" />,
          buttonText: "Connected",
          disabled: true,
        };
      case "error":
        return {
          icon: <Bluetooth className="h-6 w-6 text-destructive" />,
          text: "Connection failed",
          buttonIcon: <Bluetooth className="mr-2 h-4 w-4" />,
          buttonText: "Retry Connection",
          disabled: false,
        };
      case "unsupported":
      case "disconnected":
      default:
        return {
          icon: <Bluetooth className="h-6 w-6 text-muted-foreground" />,
          text: "Not connected",
          buttonIcon: <Bluetooth className="mr-2 h-4 w-4" />,
          buttonText: "Connect Device",
          disabled: status === "unsupported",
        };
    }
  };
  
  const { icon, text, buttonIcon, buttonText, disabled } = renderStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bluetooth Connection</CardTitle>
        <CardDescription>Connect to your Rundex-compatible BLE sensor in real-time.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6 text-center pt-8">
        {status === "unsupported" && diagnostics ? (
          <div className="w-full text-left">
             <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Bluetooth Not Supported</AlertTitle>
              <AlertDescription>
                Il browser non espone `navigator.bluetooth`. Possibili cause: browser non compatibile, contesto non sicuro (HTTPS), o esecuzione dentro un iframe.
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-y-2 text-sm">
                <h4 className="font-semibold">Suggerimenti:</h4>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    {diagnostics.inIframe && (
                        <li>
                            <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                                Apri l'app in una nuova scheda
                                <ExternalLink className="inline-block ml-1 h-4 w-4" />
                            </a>
                        </li>
                    )}
                    <li>Se usi un IDE cloud, pubblica su Firebase Hosting e testa l'URL pubblico.</li>
                    <li>Su Linux: assicurati che il servizio `bluetooth` (BlueZ) sia attivo (`systemctl status bluetooth`).</li>
                    <li>Su Android: usa Chrome e controlla "Impostazioni sito" → "Bluetooth".</li>
                </ul>
            </div>
             <details className="mt-4 text-xs">
                <summary className="cursor-pointer font-medium">Diagnostic Log</summary>
                <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto text-muted-foreground whitespace-pre-wrap">
                  {log.join('\n')}
                </pre>
            </details>
          </div>
        ) : (
          <>
            <div className="p-4 bg-secondary rounded-full">
                {icon}
            </div>
            <p className="font-medium">{text}</p>
            <Button onClick={handleConnect} disabled={disabled} size="lg" className="font-semibold">
              {buttonIcon}
              {buttonText}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
