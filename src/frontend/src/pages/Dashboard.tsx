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
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortCriteria>('roomNumber');
  const [dischargingResidentId, setDischargingResidentId] = useState<bigint | null>(null);

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

  const { data: isAdmin = false, isLoading: loadingAdmin } = useIsCallerAdmin();

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

  const handleDischargeResident = async (id: bigint) => {
    setDischargingResidentId(id);
    try {
      await dischargeResident.mutateAsync(id);
      toast.success('Resident discharged successfully');
    } catch (error: unknown) {
      console.error('Discharge error:', error);
      
      // Check for authorization errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('unauthorized') || message.includes('admin')) {
          toast.error('Only administrators can discharge residents', {
            description: 'Please contact an administrator to perform this action.',
            icon: <ShieldAlert className="h-5 w-5" />,
          });
        } else {
          toast.error('Failed to discharge resident', {
            description: error.message || 'An unexpected error occurred. Please try again.',
          });
        }
      } else {
        toast.error('Failed to discharge resident', {
          description: 'An unexpected error occurred. Please try again.',
        });
      }
    } finally {
      setDischargingResidentId(null);
    }
  };

  const handleArchiveResident = async () => {
    if (residentToArchive) {
      try {
        await archiveResident.mutateAsync(residentToArchive);
        toast.success('Resident archived successfully');
        setResidentToArchive(null);
      } catch (error: unknown) {
        console.error('Archive error:', error);
        
        // Check for authorization errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('unauthorized') || message.includes('admin')) {
            toast.error('Only administrators can archive residents', {
              description: 'Please contact an administrator to perform this action.',
              icon: <ShieldAlert className="h-5 w-5" />,
            });
          } else {
            toast.error('Failed to archive resident', {
              description: error.message || 'An unexpected error occurred. Please try again.',
            });
          }
        } else {
          toast.error('Failed to archive resident', {
            description: 'An unexpected error occurred. Please try again.',
          });
        }
        setResidentToArchive(null);
      }
    }
  };

  const handleDeleteResident = async () => {
    if (residentToDelete) {
      try {
        await deleteResident.mutateAsync(residentToDelete);
        toast.success('Resident permanently deleted');
        setResidentToDelete(null);
      } catch (error: unknown) {
        console.error('Delete error:', error);
        
        // Check for authorization errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('unauthorized') || message.includes('admin')) {
            toast.error('Only administrators can delete residents', {
              description: 'Please contact an administrator to perform this action.',
              icon: <ShieldAlert className="h-5 w-5" />,
            });
          } else if (message.includes('not found')) {
            toast.error('Resident not found', {
              description: 'The resident may have already been deleted.',
            });
          } else {
            toast.error('Failed to delete resident', {
              description: error.message || 'An unexpected error occurred. Please try again.',
            });
          }
        } else {
          toast.error('Failed to delete resident', {
            description: 'An unexpected error occurred. Please try again.',
          });
        }
        setResidentToDelete(null);
      }
    }
  };

  // Helper function to format room display
  const formatRoomDisplay = (resident: Resident): string => {
    if (resident.roomType === RoomType.sharedRoom && resident.bed) {
      return `Room ${resident.roomNumber} - Shared (Bed ${resident.bed})`;
    }
    return `Room ${resident.roomNumber} - Solo`;
  };

  const ResidentCard = ({ resident }: { resident: Resident }) => {
    const age = calculateAge(resident.dateOfBirth);
    const isActive = resident.status === 'active';
    const isDischarging = dischargingResidentId === resident.id;

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

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate({ to: '/resident/$residentId', params: { residentId: resident.id.toString() } })}
            >
              <Eye className="mr-1 h-4 w-4" />
              View Profile
            </Button>
            {isActive && isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDischargeResident(resident.id)}
                disabled={isDischarging}
                className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              >
                {isDischarging ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserX className="mr-1 h-4 w-4" />
                    Discharge
                  </>
                )}
              </Button>
            )}
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResidentToArchive(resident.id)}
                  disabled={archiveResident.isPending}
                  className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResidentToDelete(resident.id)}
                  disabled={deleteResident.isPending}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
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
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Resident Management</h2>
            <p className="mt-1 text-gray-600">Manage and monitor all residents</p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600 shadow-lg hover:from-teal-700 hover:to-blue-700"
            >
              <UserPlus className="h-5 w-5" />
              Add New Resident
            </Button>
          )}
        </div>

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
              <CardDescription>Discharged</CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-600">
                {loadingDischarged ? <Loader2 className="h-8 w-8 animate-spin" /> : dischargedResidents.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filter and Sort Controls */}
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Room Filter */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Filter className="h-4 w-4 text-teal-600" />
                    <span>Filter by Room:</span>
                  </div>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select room" />
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
                  {selectedRoom !== 'all' && (
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300">
                      Showing Room {selectedRoom}
                    </Badge>
                  )}
                </div>

                {/* Sort Control */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <ArrowUpDown className="h-4 w-4 text-teal-600" />
                    <span>Sort by:</span>
                  </div>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortCriteria)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roomNumber">Room Number & Bed</SelectItem>
                      <SelectItem value="residentId">Resident ID</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Residents Tabs */}
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
            {errorAll && <ErrorAlert error={allError as Error} onRetry={refetchAll} />}
            {loadingAll ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : filteredAllResidents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900">No residents found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedRoom !== 'all' 
                      ? `No residents in Room ${selectedRoom}`
                      : 'Add your first resident to get started'
                    }
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
            {errorActive && <ErrorAlert error={activeError as Error} onRetry={refetchActive} />}
            {loadingActive ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : filteredActiveResidents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900">No active residents</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedRoom !== 'all' 
                      ? `No active residents in Room ${selectedRoom}`
                      : 'All residents have been discharged'
                    }
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
            {errorDischarged && <ErrorAlert error={dischargedError as Error} onRetry={refetchDischarged} />}
            {loadingDischarged ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : filteredDischargedResidents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserX className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900">No discharged residents</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedRoom !== 'all' 
                      ? `No discharged residents in Room ${selectedRoom}`
                      : 'No residents have been discharged yet'
                    }
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

      {/* Footer */}
      <footer className="border-t bg-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} Moritz Care Home • Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {/* Add Resident Dialog */}
      <AddResidentDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={residentToArchive !== null} onOpenChange={(open) => !open && setResidentToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Resident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this resident? Archived residents will be hidden from the main view but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveResident} className="bg-amber-600 hover:bg-amber-700">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={residentToDelete !== null} onOpenChange={(open) => !open && setResidentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Resident</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-red-600">Warning: This action cannot be undone!</p>
              <p>
                Are you sure you want to permanently delete this resident? All associated data including medications, records, and vitals will be permanently removed from the system.
              </p>
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
