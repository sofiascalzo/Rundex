
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bluetooth, BluetoothConnected, BluetoothSearching, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error" | "unsupported";

export default function BluetoothConnect() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      if (!navigator.bluetooth) {
        setStatus("unsupported");
        setIsUnsupported(true);
      }
      if (window.self !== window.top) {
        setIsIframe(true);
      }
    }
  }, []);

  const handleConnect = async () => {
    if (!isClient || !navigator.bluetooth) {
      setStatus("unsupported");
      setIsUnsupported(true);
      return;
    }

    setStatus("connecting");
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access'] // Using a standard service
      });
      
      setDeviceName(device.name || "Unnamed Device");
      setStatus("connected");
      
      toast({
        title: "Device Connected",
        description: `Successfully connected to ${device.name || "Unnamed Device"}.`,
      });

      device.addEventListener('gattserverdisconnected', () => {
        setStatus("disconnected");
        setDeviceName(null);
        toast({
          title: "Device Disconnected",
          description: "The Bluetooth device has been disconnected.",
        });
      });

    } catch (error) {
      console.error("Bluetooth connection error:", error);
      // User cancelled the request
      if ((error as Error).name === 'NotFoundError') {
        setStatus("disconnected");
        return;
      }
      setStatus("error");
      setTimeout(() => setStatus("disconnected"), 3000);
      toast({
        title: "Connection Failed",
        description: "Could not connect to the Bluetooth device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStatus = () => {
    switch (status) {
      case "unsupported":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
          text: "Web Bluetooth API not supported",
          buttonIcon: <Bluetooth className="mr-2 h-4 w-4" />,
          buttonText: "Connect Device",
          disabled: true,
        };
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
      case "disconnected":
      default:
        return {
          icon: <Bluetooth className="h-6 w-6 text-muted-foreground" />,
          text: "Not connected",
          buttonIcon: <Bluetooth className="mr-2 h-4 w-4" />,
          buttonText: "Connect Device",
          disabled: false,
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
        {isUnsupported ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Bluetooth Not Supported</AlertTitle>
            <AlertDescription>
              Your browser may not support the Web Bluetooth API, or the app is running in an unsupported context (like an iframe).
              {isIframe && (
                <Button variant="link" asChild className="p-0 h-auto mt-2">
                  <a href={window.location.href} target="_blank" rel="noopener noreferrer">
                    Try opening the app in a new tab <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="p-4 bg-secondary rounded-full">
                {icon}
            </div>
            <p className="font-medium">{text}</p>
            <Button onClick={handleConnect} disabled={disabled || !isClient} size="lg" className="font-semibold">
              {buttonIcon}
              {buttonText}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
