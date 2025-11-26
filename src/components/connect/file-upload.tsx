"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileUp, FileCheck, Loader2 } from "lucide-react";
import type { RunData, ImuSample } from "@/lib/types";

// Helper to parse CSV data into a structured format
function parseImuCsv(csv: string): RunData[] {
  const lines = csv.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error("CSV must have a header and at least one data row.");
  }
  const header = lines[0].split(',').map(h => h.trim());
  const data: RunData[] = [];

  const timeIndex = header.indexOf('timestamp');
  const axIndex = header.indexOf('ax');
  const ayIndex = header.indexOf('ay');
  const azIndex = header.indexOf('az');
  const gxIndex = header.indexOf('gx');
  const gyIndex = header.indexOf('gy');
  const gzIndex = header.indexOf('gz');

  if (timeIndex === -1 || axIndex === -1 || ayIndex === -1 || azIndex === -1 || gxIndex === -1 || gyIndex === -1 || gzIndex === -1) {
    throw new Error("CSV header must contain 'timestamp', 'ax', 'ay', 'az', 'gx', 'gy', 'gz'.");
  }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => parseFloat(v));
    const timestamp = new Date(values[timeIndex]).toISOString();

    const sample: RunData = {
      timestamp,
      accel: { x: values[axIndex], y: values[ayIndex], z: values[azIndex] },
      gyro: { x: values[gxIndex], y: values[gyIndex], z: values[gzIndex] },
      // Mock other values for now, to be calculated later
      speed: 0,
      stride_length: 0,
      step_count: i,
      posture_error: 0,
    };
    data.push(sample);
  }
  return data;
}


export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      const fileName = selectedFile.name;

      if (fileType === "application/json" || fileName.endsWith(".json") || fileType === "text/csv" || fileName.endsWith(".csv")) {
        setFile(selectedFile);
      } else {
        setFile(null);
        e.target.value = "";
        toast({
          title: "Invalid File Type",
          description: "Please upload a .json or .csv file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            throw new Error("Failed to read file content.");
        }

        let data: RunData[];
        if (file.name.endsWith(".csv")) {
          data = parseImuCsv(text);
        } else {
          data = JSON.parse(text);
        }

        // Basic validation
        if (!Array.isArray(data) || data.length === 0 || !data[0].timestamp) {
            throw new Error("Invalid or empty data. Make sure it's an array of run data points with timestamps.");
        }

        sessionStorage.setItem("uploadedRunData", JSON.stringify(data));
        
        toast({
          title: "Upload Successful",
          description: `"${file.name}" has been processed.`,
        });
        
        // Redirect to dashboard
        router.push("/dashboard");

      } catch (error: any) {
        toast({
          title: "Processing Error",
          description: error.message || "Could not parse the file.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
        toast({
            title: "File Read Error",
            description: "An error occurred while reading the file.",
            variant: "destructive",
        });
        setIsUploading(false);
    };

    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Run Data</CardTitle>
        <CardDescription>Manually upload a .json or .csv file from your device.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6 text-center pt-8">
        <div className="p-4 bg-secondary rounded-full">
            {file ? <FileCheck className="h-6 w-6 text-accent" /> : <FileUp className="h-6 w-6 text-muted-foreground" />}
        </div>
        <div className="w-full max-w-sm space-y-2">
            <Input id="file-upload" type="file" accept=".json,.csv" onChange={handleFileChange} className="text-muted-foreground file:text-primary file:font-semibold"/>
            {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
        </div>
        <Button onClick={handleUpload} disabled={!file || isUploading} size="lg" className="font-semibold">
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Upload and Visualize
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
