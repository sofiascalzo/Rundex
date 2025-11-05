import AppLayout from "@/components/app-layout";
import BluetoothConnect from "@/components/connect/bluetooth-connect";
import FileUpload from "@/components/connect/file-upload";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rundex - Connect",
};

export default function ConnectPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-wide">Connect Device</h1>
        <p className="text-muted-foreground max-w-2xl">Connect your BLE sensor to stream live run data, or upload a session file manually to get started.</p>
        <div className="grid gap-6 md:grid-cols-2">
            <BluetoothConnect />
            <FileUpload />
        </div>
      </div>
    </AppLayout>
  );
}
