import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Loader2 } from 'lucide-react';

export default function ProfileSetup() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !employeeId) return;

    await saveProfile.mutateAsync({
      name,
      role,
      employeeId,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-teal-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-blue-600 shadow-lg">
            <Heart className="h-8 w-8 text-white" fill="white" />
          </div>
          <CardTitle className="text-2xl">Welcome to Moritz Care Home</CardTitle>
          <CardDescription>Please complete your profile to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Nurse">Nurse</SelectItem>
                  <SelectItem value="Caregiver">Caregiver</SelectItem>
                  <SelectItem value="Medical Staff">Medical Staff</SelectItem>
                  <SelectItem value="Support Staff">Support Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                placeholder="Enter your employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
              disabled={saveProfile.isPending || !name || !role || !employeeId}
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
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
