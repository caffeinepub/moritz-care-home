import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useSaveCallerUserProfile } from "../hooks/useQueries";
import BrandLogo from "./BrandLogo";

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [validationError, setValidationError] = useState("");

  const { mutate: saveProfile, isPending, error } = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!name.trim()) {
      setValidationError("Please enter your name.");
      return;
    }
    if (!employeeId.trim()) {
      setValidationError("Please enter your employee ID.");
      return;
    }

    saveProfile(
      { name: name.trim(), employeeId: employeeId.trim() },
      {
        onSuccess: () => {
          onComplete();
        },
        onError: (err) => {
          console.error("Profile setup error:", err);
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <BrandLogo mode="rectangular" size="lg" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome! Set Up Your Profile</CardTitle>
            <CardDescription>
              Please enter your details to complete your account setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="Enter your employee ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={isPending}
                />
              </div>

              {(validationError || error) && (
                <p className="text-sm text-destructive">
                  {validationError ||
                    (error instanceof Error
                      ? error.message
                      : "An error occurred. Please try again.")}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
