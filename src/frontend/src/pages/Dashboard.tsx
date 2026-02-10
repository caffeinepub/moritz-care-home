import { useState, useMemo } from 'react';
import { useGetAllResidents, useGetActiveResidents, useGetDischargedResidents, useDischargeResident, useArchiveResident, usePermanentlyDeleteResident, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, UserPlus, LogOut, Loader2, UserCheck, UserX, Archive, Eye, DoorOpen, Filter, ArrowUpDown, AlertCircle, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import AddResidentDialog from '../components/AddResidentDialog';
import BrandLogo from '@/components/BrandLogo';
import DiagnosticsIndicator from '@/components/DiagnosticsIndicator';
import { calculateAge } from '../lib/dateUtils';
import type { Resident } from '../backend';
import { RoomType } from '../backend';

type SortCriteria = 'roomNumber' | 'residentId' | 'name';

export default function Dashboard() {
  const navigate = useNavigate();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [residentToArchive, setResidentToArchive] = useState<bigint | null>(null);
  const [residentToDelete, setResidentToDelete] = useState<bigint | null>(null);
  const [residentToDischarge, setResidentToDischarge] = useState<bigint | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortCriteria>('roomNumber');

  const { 
    data: allResidents = [], 
    isLoading: loadingAll, 
    isError: errorAll, 
    error: allError,
    refetch: refetchAll 
  } = useGetAllResidents();
  
  const { 
    data: activeResidents = [], 
    isLoading: loadingActive, 
    isError: errorActive, 
    error: activeError,
    refetch: refetchActive 
  } = useGetActiveResidents();
  
  const { 
    data: dischargedResidents = [], 
    isLoading: loadingDischarged, 
    isError: errorDischarged, 
    error: dischargedError,
    refetch: refetchDischarged 
  } = useGetDischargedResidents();

  const { 
    data: isAdmin = false, 
    isLoading: loadingAdmin, 
    isError: adminCheckError,
    error: adminError,
    refetch: refetchAdminCheck 
  } = useIsCallerAdmin();

  const dischargeResident = useDischargeResident();
  const archiveResident = useArchiveResident();
  const deleteResident = usePermanentlyDeleteResident();

  // Extract unique room numbers from all residents
  const roomNumbers = useMemo(() => {
    const rooms = new Set<string>();
    allResidents.forEach(resident => {
      if (resident.roomNumber) {
        rooms.add(resident.roomNumber);
      }
    });
    return Array.from(rooms).sort((a, b) => {
      // Try to sort numerically if possible
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [allResidents]);

  // Sort residents based on selected criteria
  const sortResidents = (residents: Resident[]): Resident[] => {
    const sorted = [...residents];
    
    switch (sortBy) {
      case 'residentId':
        return sorted.sort((a, b) => {
          const idA = Number(a.id);
          const idB = Number(b.id);
          return idA - idB;
        });
      
      case 'name':
        return sorted.sort((a, b) => {
          const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
          const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
      case 'roomNumber':
      default:
        return sorted.sort((a, b) => {
          // Try to sort numerically if possible
          const numA = parseInt(a.roomNumber, 10);
          const numB = parseInt(b.roomNumber, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            if (numA !== numB) {
              return numA - numB;
            }
            // Same room number, sort by bed (A before B) for shared rooms
            if (a.roomType === RoomType.sharedRoom && b.roomType === RoomType.sharedRoom) {
              const bedA = a.bed || '';
              const bedB = b.bed || '';
              return bedA.localeCompare(bedB);
            }
            return 0;
          }
          // Fallback to string comparison
          const roomCompare = a.roomNumber.localeCompare(b.roomNumber);
          if (roomCompare !== 0) {
            return roomCompare;
          }
          // Same room number, sort by bed for shared rooms
          if (a.roomType === RoomType.sharedRoom && b.roomType === RoomType.sharedRoom) {
            const bedA = a.bed || '';
            const bedB = b.bed || '';
            return bedA.localeCompare(bedB);
          }
          return 0;
        });
    }
  };

  // Filter residents by selected room
  const filterByRoom = (residents: Resident[]) => {
    if (selectedRoom === 'all') return residents;
    return residents.filter(r => r.roomNumber === selectedRoom);
  };

  // Apply filtering and sorting
  const filteredAllResidents = useMemo(() => {
    const filtered = filterByRoom(allResidents);
    return sortResidents(filtered);
  }, [allResidents, selectedRoom, sortBy]);

  const filteredActiveResidents = useMemo(() => {
    const filtered = filterByRoom(activeResidents);
    return sortResidents(filtered);
  }, [activeResidents, selectedRoom, sortBy]);

  const filteredDischargedResidents = useMemo(() => {
    const filtered = filterByRoom(dischargedResidents);
    return sortResidents(filtered);
  }, [dischargedResidents, selectedRoom, sortBy]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleDischargeResident = async () => {
    if (!residentToDischarge) return;

    try {
      await dischargeResident.mutateAsync(residentToDischarge);
      toast.success('Resident discharged successfully');
      setResidentToDischarge(null);
    } catch (error: unknown) {
      console.error('Discharge error:', error);
      
      if (error instanceof Error) {
        toast.error('Failed to discharge resident', {
          description: error.message,
        });
      } else {
        toast.error('Failed to discharge resident', {
          description: 'An unexpected error occurred. Please try again.',
        });
      }
      setResidentToDischarge(null);
    }
  };

  const handleArchiveResident = async () => {
    if (!residentToArchive) return;

    try {
      await archiveResident.mutateAsync(residentToArchive);
      toast.success('Resident archived successfully');
      setResidentToArchive(null);
    } catch (error: unknown) {
      console.error('Archive error:', error);
      
      if (error instanceof Error) {
        toast.error('Failed to archive resident', {
          description: error.message,
        });
      } else {
        toast.error('Failed to archive resident', {
          description: 'An unexpected error occurred. Please try again.',
        });
      }
      setResidentToArchive(null);
    }
  };

  const handleDeleteResident = async () => {
    if (!residentToDelete) return;

    try {
      await deleteResident.mutateAsync(residentToDelete);
      toast.success('Resident permanently deleted');
      setResidentToDelete(null);
    } catch (error: unknown) {
      console.error('Delete error:', error);
      
      if (error instanceof Error) {
        toast.error('Failed to delete resident', {
          description: error.message,
        });
      } else {
        toast.error('Failed to delete resident', {
          description: 'An unexpected error occurred. Please try again.',
        });
      }
      setResidentToDelete(null);
    }
  };

  // Retry all resident queries
  const handleRetryResidents = () => {
    refetchAll();
    refetchActive();
    refetchDischarged();
  };

  // Helper function to format room display
  const formatRoomDisplay = (resident: Resident): string => {
    if (resident.roomType === RoomType.sharedRoom && resident.bed) {
      return `Room ${resident.roomNumber} - Shared (Bed ${resident.bed})`;
    }
    return `Room ${resident.roomNumber} - Solo`;
  };

  // Get resident name for confirmation dialogs
  const getResidentName = (id: bigint | null): string => {
    if (!id) return '';
    const resident = allResidents.find(r => r.id === id);
    return resident ? `${resident.firstName} ${resident.lastName}` : '';
  };

  const ResidentCard = ({ resident }: { resident: Resident }) => {
    const age = calculateAge(resident.dateOfBirth);
    const isActive = resident.status === 'active';

    return (
      <Card className="group transition-all hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {resident.firstName} {resident.lastName}
                </CardTitle>
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300 font-semibold">
                  <DoorOpen className="mr-1 h-3 w-3" />
                  {formatRoomDisplay(resident)}
                </Badge>
              </div>
              <CardDescription className="mt-1 text-sm">
                Age: {age} years • ID: {resident.id.toString()}
              </CardDescription>
            </div>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
            >
              {isActive ? (
                <>
                  <UserCheck className="mr-1 h-3 w-3" />
                  Active
                </>
              ) : (
                <>
                  <UserX className="mr-1 h-3 w-3" />
                  Discharged
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Physicians</p>
              <p className="font-medium text-gray-900">{resident.physicians.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Medications</p>
              <p className="font-medium text-gray-900">{resident.medications.length}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[120px]"
              onClick={() => navigate({ to: '/resident/$residentId', params: { residentId: resident.id.toString() } })}
            >
              <Eye className="mr-1 h-4 w-4" />
              View Profile
            </Button>
            {/* Only show admin actions when admin check has completed and user is admin */}
            {!loadingAdmin && isAdmin && (
              <>
                {isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResidentToDischarge(resident.id)}
                    disabled={dischargeResident.isPending}
                    className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                  >
                    {dischargeResident.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="mr-1 h-4 w-4" />
                    )}
                    Discharge
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResidentToArchive(resident.id)}
                  disabled={archiveResident.isPending}
                  className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                >
                  {archiveResident.isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-1 h-4 w-4" />
                  )}
                  Archive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResidentToDelete(resident.id)}
                  disabled={deleteResident.isPending}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {deleteResident.isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ErrorAlert = ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Failed to load residents</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message || 'An error occurred while loading resident data.'}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-4 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );

  const AdminCheckAlert = () => {
    if (loadingAdmin) {
      return (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertTitle className="text-blue-900">Checking admin permissions...</AlertTitle>
          <AlertDescription className="text-blue-700">
            Please wait while we verify your access level.
          </AlertDescription>
        </Alert>
      );
    }

    if (adminCheckError && adminError) {
      const errorMessage = adminError instanceof Error 
        ? adminError.message 
        : 'Unable to determine admin status. Admin actions may not be available.';
      
      const isCompatibilityIssue = errorMessage.toLowerCase().includes('compatibility') || 
                                   errorMessage.toLowerCase().includes('out of date') ||
                                   errorMessage.toLowerCase().includes('not available');
      
      return (
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>
            {isCompatibilityIssue ? 'Backend Compatibility Issue' : 'Admin permissions check failed'}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchAdminCheck()}
              className="ml-4 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Moritz Care Home</h1>
              <p className="text-sm text-gray-600">Assisted Living Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DiagnosticsIndicator />
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Resident Management</h2>
            <p className="mt-1 text-gray-600">Manage and monitor all residents</p>
          </div>
          {!loadingAdmin && isAdmin && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600 shadow-lg hover:from-teal-700 hover:to-blue-700"
            >
              <UserPlus className="h-5 w-5" />
              Add New Resident
            </Button>
          )}
        </div>

        {/* Admin Check Alert */}
        <AdminCheckAlert />

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-teal-500">
            <CardHeader className="pb-3">
              <CardDescription>Total Residents</CardDescription>
              <CardTitle className="text-3xl font-bold text-teal-600">
                {loadingAll ? <Loader2 className="h-8 w-8 animate-spin" /> : allResidents.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardDescription>Active Residents</CardDescription>
              <CardTitle className="text-3xl font-bold text-green-600">
                {loadingActive ? <Loader2 className="h-8 w-8 animate-spin" /> : activeResidents.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-gray-500">
            <CardHeader className="pb-3">
              <CardDescription>Discharged Residents</CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-600">
                {loadingDischarged ? <Loader2 className="h-8 w-8 animate-spin" /> : dischargedResidents.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {roomNumbers.map((room) => (
                  <SelectItem key={room} value={room}>
                    Room {room}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-gray-500" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortCriteria)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roomNumber">Room Number</SelectItem>
                <SelectItem value="residentId">Resident ID</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Active
            </TabsTrigger>
            <TabsTrigger value="discharged" className="gap-2">
              <UserX className="h-4 w-4" />
              Discharged
            </TabsTrigger>
          </TabsList>

          {/* All Residents Tab */}
          <TabsContent value="all" className="space-y-4">
            {errorAll && allError && (
              <ErrorAlert error={allError as Error} onRetry={handleRetryResidents} />
            )}
            {loadingAll ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
              </div>
            ) : filteredAllResidents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-lg font-medium text-gray-600">No residents found</p>
                  <p className="text-sm text-gray-500">
                    {selectedRoom !== 'all' ? 'Try selecting a different room' : 'Add your first resident to get started'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAllResidents.map((resident) => (
                  <ResidentCard key={resident.id.toString()} resident={resident} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Active Residents Tab */}
          <TabsContent value="active" className="space-y-4">
            {errorActive && activeError && (
              <ErrorAlert error={activeError as Error} onRetry={handleRetryResidents} />
            )}
            {loadingActive ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
              </div>
            ) : filteredActiveResidents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserCheck className="mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-lg font-medium text-gray-600">No active residents found</p>
                  <p className="text-sm text-gray-500">
                    {selectedRoom !== 'all' ? 'Try selecting a different room' : 'All residents have been discharged'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredActiveResidents.map((resident) => (
                  <ResidentCard key={resident.id.toString()} resident={resident} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Discharged Residents Tab */}
          <TabsContent value="discharged" className="space-y-4">
            {errorDischarged && dischargedError && (
              <ErrorAlert error={dischargedError as Error} onRetry={handleRetryResidents} />
            )}
            {loadingDischarged ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
              </div>
            ) : filteredDischargedResidents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserX className="mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-lg font-medium text-gray-600">No discharged residents found</p>
                  <p className="text-sm text-gray-500">
                    {selectedRoom !== 'all' ? 'Try selecting a different room' : 'No residents have been discharged yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDischargedResidents.map((resident) => (
                  <ResidentCard key={resident.id.toString()} resident={resident} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Resident Dialog */}
      <AddResidentDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

      {/* Discharge Confirmation Dialog */}
      <AlertDialog open={!!residentToDischarge} onOpenChange={() => setResidentToDischarge(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discharge Resident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discharge {getResidentName(residentToDischarge)}? This action can be reversed later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDischargeResident}>
              Discharge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!residentToArchive} onOpenChange={() => setResidentToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Resident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {getResidentName(residentToArchive)}? Archived residents will be hidden from the main view but can be restored if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveResident}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!residentToDelete} onOpenChange={() => setResidentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Resident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {getResidentName(residentToDelete)}? This action cannot be undone and all associated data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteResident} className="bg-red-600 hover:bg-red-700">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
