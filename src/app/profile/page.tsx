// src/app/profile/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// This is a client component, so we can't export metadata directly.
// We can set the title via useEffect.
// export const metadata: Metadata = {
//   title: "Rundex - Profile",
// };


const profileFormSchema = z.object({
  nickname: z.string().min(2, { message: "Nickname must be at least 2 characters." }).max(50),
  avatarUrl: z.string(),
  weight: z.coerce.number().positive({ message: "Weight must be a positive number." }),
});

export default function ProfilePage() {
    useEffect(() => {
        document.title = "Rundex - Profile";
    }, []);

  const { profile, saveProfile, isLoaded } = useUserProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nickname: "",
      avatarUrl: "",
      weight: 0,
    },
  });

  useEffect(() => {
    if (isLoaded) {
      form.reset({
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl,
        weight: profile.weight,
      });
    }
  }, [isLoaded, profile, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newAvatarUrl = e.target?.result as string;
        form.setValue("avatarUrl", newAvatarUrl);
        // Save profile immediately when avatar changes to make it persistent
        saveProfile({ ...form.getValues(), avatarUrl: newAvatarUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: z.infer<typeof profileFormSchema>) => {
    saveProfile(values);
    toast({
      title: "Profile Updated",
      description: "Your information has been saved successfully.",
    });
  };

  const avatarUrl = form.watch("avatarUrl");
  const nickname = form.watch("nickname");

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-wide">My Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details here. Changes will be saved locally in your browser.</CardDescription>
          </CardHeader>
          <CardContent>
            { !isLoaded ? (
                <div className="space-y-8">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            ) : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="flex items-center space-x-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarUrl} alt={nickname} data-ai-hint="person running" />
                        <AvatarFallback>{nickname?.substring(0, 2).toUpperCase() || 'JD'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow space-y-2">
                      <FormLabel>Profile Picture</FormLabel>
                      <Input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/gif"
                      />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </Button>
                      <p className="text-xs text-muted-foreground">Recommended: Square image, under 1MB.</p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nickname</FormLabel>
                        <FormControl>
                          <Input placeholder="Your nickname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="75" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </form>
              </Form>
            )}
            
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
