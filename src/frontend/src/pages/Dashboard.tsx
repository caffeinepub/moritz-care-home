import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetActiveResidents, useGetDischargedResidents, useDischargeResident, useDeleteResident, useIsCallerAdmin } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, UserCheck, UserX, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDate, calculateAge } from '../lib/dateUtils';
import AddResidentDialog from '../components/AddResidentDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Resident } from '../backend';

/**
 * Main dashboard displaying residents in tabbed views with resilient actor-based queries, proper loading states, error recovery with retry, and admin-only actions.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dischargeConfirmOpen, setDischargeConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  const { 
    data: activeResidents = [], 
    isLoading: loadingActive, 
    error: activeError,
    isFetched: activeFetched,
    refetch: refetchActive
  } = useGetActiveResidents();
  
  const { 
    data: dischargedResidents = [], 
    isLoading: loadingDischarged, 
    error: dischargedError,
    isFetched: dischargedFetched,
    refetch: refetchDischarged
  } = useGetDischargedResidents();
  
  const { 
    data: isAdmin, 
    isLoading: adminLoading,
    error: adminError,
    refetch: refetchAdmin
  } = useIsCallerAdmin();

  const dischargeMutation = useDischargeResident();
  const deleteMutation = useDeleteResident();

  const handleDischargeClick = (resident: Resident) => {
    setSelectedResident(resident);
    setDischargeConfirmOpen(true);
  };

  const handleDeleteClick = (resident: Resident) => {
    setSelectedResident(resident);
    setDeleteConfirmOpen(true);
  };

  const handleDischargeConfirm = async () => {
    if (!selectedResident) return;

    try {
      await dischargeMutation.mutateAsync(selectedResident.id);
      toast.success(`${selectedResident.firstName} ${selectedResident.lastName} has been discharged successfully.`);
      setDischargeConfirmOpen(false);
      setSelectedResident(null);
    } catch (error) {
      console.error('Discharge error:', error);
      const message = error instanceof Error ? error.message : 'Failed to discharge resident. Please try again.';
      toast.error(message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedResident) return;

    try {
      await deleteMutation.mutateAsync(selectedResident.id);
      toast.success(`${selectedResident.firstName} ${selectedResident.lastName} has been permanently deleted.`);
      setDeleteConfirmOpen(false);
      setSelectedResident(null);
    } catch (error) {
      console.error('Delete error:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete resident. Please try again.';
      toast.error(message);
    }
  };

  const handleRetry = () => {
    refetchActive();
    refetchDischarged();
    refetchAdmin();
  };

  const renderResidentCard = (resident: Resident) => {
    const age = calculateAge(resident.dateOfBirth);
    const initials = `${resident.firstName[0]}${resident.lastName[0]}`;
    const isActive = resident.status === 'active';

    return (
      <Card
        key={resident.id.toString()}
        className="cursor-pointer transition-shadow hover:shadow-lg"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle
                className="text-lg hover:text-primary"
                onClick={() => navigate({ to: `/resident/${resident.id}` })}
              >
                {resident.firstName} {resident.lastName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Room {resident.roomNumber}
                {resident.bed && ` - Bed ${resident.bed}`}
              </p>
            </div>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Discharged'}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age:</span>
              <span className="font-medium">{age} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="font-medium">{formatDate(resident.dateOfBirth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admission Date:</span>
              <span className="font-medium">{formatDate(resident.admissionDate)}</span>
            </div>
            {resident.dischargeTimestamp && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discharge Date:</span>
                <span className="font-medium">{formatDate(resident.dischargeTimestamp)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Medications:</span>
              <span className="font-medium">{resident.medications.length}</span>
            </div>
          </div>

          {/* Admin-only action buttons */}
          {!adminLoading && isAdmin && (
            <div className="mt-4 flex gap-2">
              {isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDischargeClick(resident);
                  }}
                  disabled={dischargeMutation.isPending}
                  className="flex-1"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Discharge
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(resident);
                }}
                disabled={deleteMutation.isPending}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Show error state with retry option
  if ((activeError || dischargedError || adminError) && (activeFetched || dischargedFetched)) {
    const errorMessage = activeError?.message || dischargedError?.message || adminError?.message || 'Failed to load residents';
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-destructive/90">{errorMessage}</p>
              <Button 
                onClick={handleRetry} 
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resident Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and view all residents in the care home
          </p>
        </div>
        {/* Admin-only Add Resident button */}
        {!adminLoading && isAdmin && (
          <Button onClick={() => setAddDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add Resident
          </Button>
        )}
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Active Residents
            {activeFetched && !loadingActive && (
              <Badge variant="secondary" className="ml-1">
                {activeResidents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="discharged" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Discharged Residents
            {dischargedFetched && !loadingDischarged && (
              <Badge variant="secondary" className="ml-1">
                {dischargedResidents.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loadingActive ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeFetched && activeResidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCheck className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No active residents</p>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? 'Click "Add Resident" to get started' : 'No residents to display'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeResidents.map(renderResidentCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discharged" className="space-y-4">
          {loadingDischarged ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : dischargedFetched && dischargedResidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserX className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No discharged residents</p>
                <p className="text-sm text-muted-foreground">
                  Discharged residents will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dischargedResidents.map(renderResidentCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Admin-only Add Resident Dialog */}
      {isAdmin && (
        <AddResidentDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      )}

      {/* Discharge Confirmation Dialog */}
      <AlertDialog open={dischargeConfirmOpen} onOpenChange={setDischargeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discharge Resident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discharge{' '}
              <span className="font-semibold">
                {selectedResident?.firstName} {selectedResident?.lastName}
              </span>
              ? This action will mark them as discharged and they will be moved to the discharged residents list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDischargeConfirm}
              disabled={dischargeMutation.isPending}
            >
              {dischargeMutation.isPending ? 'Discharging...' : 'Discharge'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold">
                {selectedResident?.firstName} {selectedResident?.lastName}
              </span>
              ? This action cannot be undone and will remove all associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
