"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileUp, FileCheck, Loader2 } from "lucide-react";
import { RunData } from "@/lib/types";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      if (selectedFile && (selectedFile.type === "application/json" || selectedFile.name.endsWith(".json"))) {
        setFile(selectedFile);
      } else {
        setFile(null);
        e.target.value = "";
        toast({
          title: "Invalid File Type",
          description: "Please upload a .json file.",
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
        const data: RunData[] = JSON.parse(text);

        // Basic validation
        if (!Array.isArray(data) || data.length === 0 || !data[0].timestamp) {
            throw new Error("Invalid or empty JSON data. Make sure it's an array of run data points.");
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
          description: error.message || "Could not parse the JSON file.",
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
        <CardDescription>Manually upload a .json file from your device.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6 text-center pt-8">
        <div className="p-4 bg-secondary rounded-full">
            {file ? <FileCheck className="h-6 w-6 text-accent" /> : <FileUp className="h-6 w-6 text-muted-foreground" />}
        </div>
        <div className="w-full max-w-sm space-y-2">
            <Input id="file-upload" type="file" accept=".json" onChange={handleFileChange} className="text-muted-foreground file:text-primary file:font-semibold"/>
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
