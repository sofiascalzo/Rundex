"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileUp, FileCheck, Loader2 } from "lucide-react";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      if (selectedFile && (selectedFile.type === "application/json" || selectedFile.name.endsWith(".csv"))) {
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
    // Simulate upload and processing
    setTimeout(() => {
      // Here you would parse the file and update the app state
      // For this demo, we'll just show a success message and redirect
      
      toast({
        title: "Upload Successful",
        description: `"${file.name}" has been processed.`,
      });
      setIsUploading(false);
      // In a real app, you might pass the data to the dashboard
      router.push("/dashboard"); 
    }, 2000);
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
