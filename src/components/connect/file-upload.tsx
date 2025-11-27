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
function parseImuCsv(csv: string): any[] {
  const lines = csv.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error("CSV must have a header and at least one data row.");
  }
  const header = lines[0].split(',').map(h => h.trim());
  const data: any[] = [];

  const timeIndex = header.indexOf('timestamp');
  const axIndex = header.indexOf('ax');
  const ayIndex = header.indexOf('ay');
  const azIndex = header.indexOf('az');
  const gxIndex = header.indexOf('gx');
  const gyIndex = header.indexOf('gy');
  const gzIndex = header.indexOf('gz');

  if (timeIndex === -1 || axIndex === -1 || ayIndex === -1 || azIndex === -1 || gxIndex === -1 || gyIndex === -1 || gzIndex === -1) {
    // Try to find header for bluetooth saved session
    const btTimeIndex = header.indexOf('timestamp');
    const btTypeIndex = header.indexOf('type');
    const btDataIndex = header.indexOf('data');

    if (btTimeIndex !== -1 && btTypeIndex !== -1 && btDataIndex !== -1) {
        // This is likely a Rundex session file, which is already JSON-like.
        // We will treat it as a JSON file. The user probably named it .csv by mistake.
        throw new Error("This looks like a Rundex session file. Please upload it as a .json file.");
    }
    throw new Error("CSV header must contain 'timestamp', 'ax', 'ay', 'az', 'gx', 'gy', 'gz'.");
  }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const timestamp = new Date(parseFloat(values[timeIndex])).toISOString();

    const sample = {
      timestamp,
      type: 'imu',
      data: {
        ax: parseFloat(values[axIndex]),
        ay: parseFloat(values[ayIndex]),
        az: parseFloat(values[azIndex]),
        gx: parseFloat(values[gxIndex]),
        gy: parseFloat(values[gyIndex]),
        gz: parseFloat(values[gzIndex]),
      }
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

        let data: any[];
        if (file.name.endsWith(".csv")) {
          data = parseImuCsv(text);
        } else {
          data = JSON.parse(text);
        }

        // Basic validation
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Invalid or empty data. Make sure it's an array of run data points.");
        }

        sessionStorage.setItem("uploadedRunData", JSON.stringify(data));
        
        toast({
          title: "Upload Successful",
          description: `"${file.name}" has been processed. Navigating to dashboard...`,
        });
        
        // Redirect to dashboard page
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
              Upload and Analyze
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
