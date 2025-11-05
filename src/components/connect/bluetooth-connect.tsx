"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bluetooth, BluetoothConnected, BluetoothSearching, Loader2 } from "lucide-react";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export default function BluetoothConnect() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleConnect = async () => {
    if (!isClient || !navigator.bluetooth) {
      toast({
        title: "Web Bluetooth API not supported",
        description: "Your browser does not support the Web Bluetooth API. Please use a compatible browser like Chrome.",
        variant: "destructive",
      });
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
          buttonText: "Connect Device",
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
        <div className="p-4 bg-secondary rounded-full">
            {icon}
        </div>
        <p className="font-medium">{text}</p>
        <Button onClick={handleConnect} disabled={disabled || !isClient} size="lg" className="font-semibold">
          {buttonIcon}
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
