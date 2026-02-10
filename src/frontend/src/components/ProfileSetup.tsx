import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle, AlertCircle } from 'lucide-react';
import { useSaveCallerUserProfileStartup } from '../hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProfileSetup() {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const saveProfileMutation = useSaveCallerUserProfileStartup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !employeeId.trim()) {
      return;
    }

    try {
      await saveProfileMutation.mutateAsync({
        name: name.trim(),
        employeeId: employeeId.trim(),
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const isFormValid = name.trim() !== '' && employeeId.trim() !== '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
            <UserCircle className="h-8 w-8 text-teal-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to Moritz Care Home</CardTitle>
          <CardDescription>Please set up your profile to continue</CardDescription>
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
                disabled={saveProfileMutation.isPending}
                required
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
                disabled={saveProfileMutation.isPending}
                required
              />
            </div>

            {saveProfileMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {saveProfileMutation.error?.message || 'Failed to save profile. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid || saveProfileMutation.isPending}
            >
              {saveProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
