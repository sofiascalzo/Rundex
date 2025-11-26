// src/hooks/use-user-profile.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserProfile {
  nickname: string;
  avatarUrl: string;
  weight: number;
}

const STORAGE_KEY = "userProfile";

const defaultProfile: UserProfile = {
  nickname: "John Doe",
  avatarUrl: "https://picsum.photos/seed/rundex-user/100/100",
  weight: 75,
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(STORAGE_KEY);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error("Failed to parse user profile from localStorage", error);
      // Use default profile if parsing fails
      setProfile(defaultProfile);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const saveProfile = useCallback((newProfile: UserProfile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (error) {
      console.error("Failed to save user profile to localStorage", error);
    }
  }, []);

  return { profile, saveProfile, isLoaded };
}
