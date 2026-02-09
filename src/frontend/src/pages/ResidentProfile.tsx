import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetResident, useAddMarRecord, useAddAdlRecord, useUpdateMedicationStatus } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Calendar, Stethoscope, Pill, FileText, Activity, Printer, Edit, Heart, Loader2, AlertCircle, RefreshCw, Phone, MapPin, Users, Syringe, Play, StopCircle, Edit2, DoorOpen, Thermometer, Droplet } from 'lucide-react';
import EditResidentDialog from '../components/EditResidentDialog';
import AddMarRecordDialog from '../components/AddMarRecordDialog';
import AddAdlRecordDialog from '../components/AddAdlRecordDialog';
import AddMedicationDialog from '../components/AddMedicationDialog';
import EditMedicationDialog from '../components/EditMedicationDialog';
import AddDailyVitalsDialog from '../components/AddDailyVitalsDialog';
import AddWeightEntryDialog from '../components/AddWeightEntryDialog';
import BrandLogo from '@/components/BrandLogo';
import { formatDate, formatDateTime, calculateAge } from '../lib/dateUtils';
import { MedicationStatus, RoomType } from '../backend';
import type { Medication, DailyVitals, Resident } from '../backend';

export default function ResidentProfile() {
  const { residentId } = useParams({ from: '/resident/$residentId' });
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMarDialog, setShowMarDialog] = useState(false);
  const [showAdlDialog, setShowAdlDialog] = useState(false);
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [showEditMedicationDialog, setShowEditMedicationDialog] = useState(false);
  const [showDailyVitalsDialog, setShowDailyVitalsDialog] = useState(false);
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);

  // Parse and validate the resident ID from route params
  let parsedResidentId: bigint | null = null;
  try {
    if (residentId && residentId.trim() !== '') {
      const numericId = parseInt(residentId, 10);
      if (!isNaN(numericId) && numericId > 0) {
        parsedResidentId = BigInt(residentId);
      }
    }
  } catch (error) {
    console.error('Invalid resident ID format:', residentId, error);
  }
  
  // Fetch resident data with comprehensive error handling
  const { 
    data: resident, 
    isLoading, 
    isError, 
    error, 
    refetch, 
    isFetching,
    isSuccess,
    failureCount,
    status
  } = useGetResident(parsedResidentId);
  
  const updateMedicationStatus = useUpdateMedicationStatus();

  // Reset print view when resident changes
  useEffect(() => {
    setIsPrinting(false);
  }, [residentId]);

  // Helper function to format room display
  const formatRoomDisplay = (resident: Resident): string => {
    if (resident.roomType === RoomType.sharedRoom && resident.bed) {
      return `Room ${resident.roomNumber} - Bed ${resident.bed}`;
    }
    return `Room ${resident.roomNumber}`;
  };

  // Handle invalid resident ID
  if (!parsedResidentId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-lg font-medium text-gray-900">Invalid Resident ID</p>
            <p className="mt-2 text-sm text-gray-600">
              The resident ID provided is not valid. Please check the URL and try again.
            </p>
            <p className="mt-1 text-xs text-gray-400">Provided ID: {residentId}</p>
            <Button onClick={() => navigate({ to: '/' })} className="mt-6">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // BULLETPROOF: Guaranteed loading state resolution
  // Show loading ONLY when query status is 'pending' (initial load)
  // This ensures immediate resolution once the query completes (success or error)
  const isLoadingState = status === 'pending';

  if (isLoadingState) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-teal-600" />
          <p className="mt-6 text-xl font-semibold text-gray-900">Loading resident profile...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we retrieve the data</p>
          <p className="mt-1 text-xs text-gray-400">Resident ID: {residentId}</p>
          {failureCount > 0 && (
            <p className="mt-2 text-xs text-amber-600">Retry attempt {failureCount} of 3...</p>
          )}
        </div>
      </div>
    );
  }

  // Error state - show specific error message with retry option
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const isNotFound = errorMessage.includes('not found');
    const isUnauthorized = errorMessage.includes('Unauthorized') || errorMessage.includes('permission');
    const isNetworkError = errorMessage.includes('connection') || errorMessage.includes('network') || errorMessage.includes('Backend connection');
    const isTimeout = errorMessage.includes('timeout');
    
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              {isNotFound ? 'Resident Not Found' : 
               isUnauthorized ? 'Access Denied' : 
               isNetworkError ? 'Connection Error' : 
               isTimeout ? 'Request Timeout' :
               'Error Loading Resident'}
            </p>
            <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
            <p className="mt-1 text-xs text-gray-400">Resident ID: {residentId}</p>
            {failureCount > 0 && (
              <p className="mt-1 text-xs text-amber-600">Failed after {failureCount} attempts</p>
            )}
            <div className="mt-6 flex justify-center gap-3">
              {!isNotFound && (
                <Button 
                  onClick={() => refetch()} 
                  variant="outline"
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </>
                  )}
                </Button>
              )}
              <Button onClick={() => navigate({ to: '/' })}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // BULLETPROOF: Handle successful query that returns null (resident not found)
  // This is critical for cases where backend returns null for non-existent residents
  if (isSuccess && !resident) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">Resident not found</p>
            <p className="mt-2 text-sm text-gray-600">
              The resident you're looking for doesn't exist or has been removed from the system.
            </p>
            <p className="mt-1 text-xs text-gray-400">Resident ID: {residentId}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </>
                )}
              </Button>
              <Button onClick={() => navigate({ to: '/' })}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // BULLETPROOF: Final safety check - if we somehow get here without resident data, show error
  // This should never happen with the above checks, but provides a safety net
  if (!resident) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
            <p className="mt-4 text-lg font-medium text-gray-900">Unable to load resident data</p>
            <p className="mt-2 text-sm text-gray-600">
              An unexpected error occurred while loading the resident profile.
            </p>
            <p className="mt-1 text-xs text-gray-400">Resident ID: {residentId}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </>
                )}
              </Button>
              <Button onClick={() => navigate({ to: '/' })}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // At this point, we have valid resident data - render the profile
  const age = calculateAge(resident.dateOfBirth);
  const isActive = resident.status === 'active';

  // Safely access nested arrays with defensive null checks and fallback to empty arrays
  const physicians = Array.isArray(resident.physicians) ? resident.physicians : [];
  const medications = Array.isArray(resident.medications) ? resident.medications : [];
  const responsiblePersons = Array.isArray(resident.responsiblePersons) ? resident.responsiblePersons : [];
  const marRecords = Array.isArray(resident.marRecords) ? resident.marRecords : [];
  const adlRecords = Array.isArray(resident.adlRecords) ? resident.adlRecords : [];
  const dailyVitals = Array.isArray(resident.dailyVitals) ? resident.dailyVitals : [];
  const weightLog = Array.isArray(resident.weightLog) ? resident.weightLog : [];

  // Separate active and discontinued medications
  const activeMedications = medications.filter(m => m.status === 'active');
  const discontinuedMedications = medications.filter(m => m.status === 'discontinued');

  // Sort daily vitals by date (most recent first)
  const sortedDailyVitals = [...dailyVitals].sort((a, b) => {
    const dateA = Number(a.measurementDateTime);
    const dateB = Number(b.measurementDateTime);
    return dateB - dateA;
  });

  // Sort weight log by date (most recent first)
  const sortedWeightLog = [...weightLog].sort((a, b) => {
    const dateA = Number(a.measurementDate);
    const dateB = Number(b.measurementDate);
    return dateB - dateA;
  });

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrinting(false), 100);
    }, 100);
  };

  const handleEditMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowEditMedicationDialog(true);
  };

  const handleDiscontinueMedication = async (medicationId: bigint) => {
    try {
      await updateMedicationStatus.mutateAsync({
        residentId: resident.id,
        medicationId,
        status: MedicationStatus.discontinued,
      });
    } catch (error) {
      console.error('Error discontinuing medication:', error);
    }
  };

  const handleStartMedication = async (medicationId: bigint) => {
    try {
      await updateMedicationStatus.mutateAsync({
        residentId: resident.id,
        medicationId,
        status: MedicationStatus.active,
      });
    } catch (error) {
      console.error('Error starting medication:', error);
    }
  };

  if (isPrinting) {
    return (
      <div className="print-profile">
        <div className="print-header">
          <div className="print-logo-container">
            <BrandLogo size="lg" className="print-logo" />
          </div>
          <h1>Moritz Care Home</h1>
          <h2>Resident Medication Report</h2>
        </div>

        {/* Resident Information Section */}
        <div className="print-section">
          <h3>Resident Information</h3>
          <div className="print-grid">
            <div className="print-field">
              <span className="print-label">Full Name:</span>
              <span className="print-value">{resident.firstName} {resident.lastName}</span>
            </div>
            <div className="print-field">
              <span className="print-label">Room Number:</span>
              <span className="print-value">{resident.roomNumber}</span>
            </div>
            {resident.roomType === RoomType.sharedRoom && resident.bed && (
              <div className="print-field">
                <span className="print-label">Bed:</span>
                <span className="print-value">{resident.bed}</span>
              </div>
            )}
            <div className="print-field">
              <span className="print-label">Date of Birth:</span>
              <span className="print-value">{formatDate(resident.dateOfBirth)}</span>
            </div>
            <div className="print-field">
              <span className="print-label">Age:</span>
              <span className="print-value">{age} years</span>
            </div>
            <div className="print-field">
              <span className="print-label">Date of Admission:</span>
              <span className="print-value">{formatDate(resident.admissionDate)}</span>
            </div>
            <div className="print-field">
              <span className="print-label">Status:</span>
              <span className="print-value">{isActive ? 'Active' : 'Discharged'}</span>
            </div>
            <div className="print-field">
              <span className="print-label">Resident ID:</span>
              <span className="print-value">{resident.id.toString()}</span>
            </div>
            <div className="print-field">
              <span className="print-label">Medicaid Number:</span>
              <span className="print-value">{resident.medicaidNumber || 'N/A'}</span>
            </div>
            <div className="print-field">
              <span className="print-label">Medicare Number:</span>
              <span className="print-value">{resident.medicareNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Active Medications Section */}
        <div className="print-section">
          <h3>Active Medications</h3>
          {activeMedications.length === 0 ? (
            <p className="print-empty">No active medications prescribed</p>
          ) : (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Medication Name</th>
                  <th>Dosage</th>
                  <th>Quantity</th>
                  <th>Route</th>
                  <th>Times</th>
                  <th>Physician</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {activeMedications.map((medication) => (
                  <tr key={medication.id.toString()}>
                    <td>{medication.name}</td>
                    <td>{medication.dosage}</td>
                    <td>{medication.dosageQuantity || 'N/A'}</td>
                    <td>{medication.administrationRoute || 'N/A'}</td>
                    <td>{medication.administrationTimes.join(', ')}</td>
                    <td>{medication.prescribingPhysician?.name || 'N/A'}</td>
                    <td>{medication.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Discontinued Medications Section */}
        <div className="print-section">
          <h3>Discontinued Medications</h3>
          {discontinuedMedications.length === 0 ? (
            <p className="print-empty">No discontinued medications</p>
          ) : (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Medication Name</th>
                  <th>Dosage</th>
                  <th>Quantity</th>
                  <th>Route</th>
                  <th>Times</th>
                  <th>Physician</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {discontinuedMedications.map((medication) => (
                  <tr key={medication.id.toString()}>
                    <td>{medication.name}</td>
                    <td>{medication.dosage}</td>
                    <td>{medication.dosageQuantity || 'N/A'}</td>
                    <td>{medication.administrationRoute || 'N/A'}</td>
                    <td>{medication.administrationTimes.join(', ')}</td>
                    <td>{medication.prescribingPhysician?.name || 'N/A'}</td>
                    <td>{medication.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Physician Signature Section - Conditionally Rendered */}
        {includeSignature && (
          <div className="print-signature-section">
            <div className="print-signature-block">
              <div className="print-signature-line">
                <span className="print-label">Physician Name:</span>
                <span className="print-signature-underline"></span>
              </div>
              <div className="print-signature-line">
                <span className="print-label">Physician Signature:</span>
                <span className="print-signature-underline"></span>
              </div>
            </div>
          </div>
        )}

        <div className="print-footer">
          <p>Report generated on {formatDate(BigInt(Date.now() * 1_000_000))}</p>
          <p>© 2026. Built with love using caffeine.ai</p>
        </div>
      </div>
    );
  }

  // Regular screen view
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/' })}
              className="hover:bg-teal-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <BrandLogo size="md" mode="rectangular" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {resident.firstName} {resident.lastName}
                </h1>
                <p className="text-sm text-gray-600">{formatRoomDisplay(resident)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isActive ? 'default' : 'secondary'} className="text-sm">
              {isActive ? 'Active' : 'Discharged'}
            </Badge>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(true)}
              className="hover:bg-teal-50"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-white px-4 py-2 shadow-sm">
              <Label htmlFor="include-signature" className="text-sm font-medium text-gray-700 cursor-pointer">
                Include Physician Signature
              </Label>
              <Switch
                id="include-signature"
                checked={includeSignature}
                onCheckedChange={setIncludeSignature}
              />
            </div>
            <Button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Calendar className="h-4 w-4" />
                Age
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{age} years</p>
              <p className="text-xs text-gray-500">{formatDate(resident.dateOfBirth)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <DoorOpen className="h-4 w-4" />
                Admission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{formatDate(resident.admissionDate)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Pill className="h-4 w-4" />
                Active Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{activeMedications.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Stethoscope className="h-4 w-4" />
                Physicians
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{physicians.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="vitals">Vitals & Weight</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Full Name</p>
                  <p className="text-base text-gray-900">{resident.firstName} {resident.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                  <p className="text-base text-gray-900">{formatDate(resident.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Age</p>
                  <p className="text-base text-gray-900">{age} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Admission Date</p>
                  <p className="text-base text-gray-900">{formatDate(resident.admissionDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Room</p>
                  <p className="text-base text-gray-900">{formatRoomDisplay(resident)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'Active' : 'Discharged'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Medicaid Number</p>
                  <p className="text-base text-gray-900">{resident.medicaidNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Medicare Number</p>
                  <p className="text-base text-gray-900">{resident.medicareNumber || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Physicians */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Physicians
                </CardTitle>
              </CardHeader>
              <CardContent>
                {physicians.length === 0 ? (
                  <p className="text-sm text-gray-500">No physicians assigned</p>
                ) : (
                  <div className="space-y-3">
                    {physicians.map((physician) => (
                      <div key={physician.id.toString()} className="rounded-lg border border-gray-200 p-3">
                        <p className="font-medium text-gray-900">{physician.name}</p>
                        <p className="text-sm text-gray-600">{physician.specialty}</p>
                        <p className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          {physician.contactNumber}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insurance & Pharmacy */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {resident.insurance ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Company</p>
                        <p className="text-base text-gray-900">{resident.insurance.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Policy Number</p>
                        <p className="text-base text-gray-900">{resident.insurance.policyNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contact</p>
                        <p className="text-sm text-gray-700">{resident.insurance.contactNumber}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No insurance information</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Pharmacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {resident.pharmacy ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Name</p>
                        <p className="text-base text-gray-900">{resident.pharmacy.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Address</p>
                        <p className="text-sm text-gray-700">{resident.pharmacy.address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contact</p>
                        <p className="text-sm text-gray-700">{resident.pharmacy.contactNumber}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No pharmacy information</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Responsible Persons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Responsible Persons
                </CardTitle>
              </CardHeader>
              <CardContent>
                {responsiblePersons.length === 0 ? (
                  <p className="text-sm text-gray-500">No responsible persons listed</p>
                ) : (
                  <div className="space-y-3">
                    {responsiblePersons.map((person) => (
                      <div key={person.id.toString()} className="rounded-lg border border-gray-200 p-3">
                        <p className="font-medium text-gray-900">{person.name}</p>
                        <p className="text-sm text-gray-600">{person.relationship}</p>
                        <p className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          {person.contactNumber}
                        </p>
                        <p className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {person.address}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Active Medications
                  </CardTitle>
                  <Button onClick={() => setShowMedicationDialog(true)} size="sm">
                    <Syringe className="mr-2 h-4 w-4" />
                    Add Medication
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeMedications.length === 0 ? (
                  <p className="text-sm text-gray-500">No active medications</p>
                ) : (
                  <div className="space-y-3">
                    {activeMedications.map((medication) => (
                      <div key={medication.id.toString()} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{medication.name}</p>
                            <p className="text-sm text-gray-600">
                              {medication.dosage} - {medication.dosageQuantity}
                            </p>
                            <p className="text-sm text-gray-600">Route: {medication.administrationRoute}</p>
                            <p className="text-sm text-gray-600">
                              Times: {medication.administrationTimes.join(', ')}
                            </p>
                            {medication.prescribingPhysician && (
                              <p className="text-sm text-gray-500">
                                Prescribed by: {medication.prescribingPhysician.name}
                              </p>
                            )}
                            {medication.notes && (
                              <p className="mt-1 text-sm text-gray-500">Notes: {medication.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMedication(medication)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDiscontinueMedication(medication.id)}
                              disabled={updateMedicationStatus.isPending}
                            >
                              <StopCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StopCircle className="h-5 w-5" />
                  Discontinued Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {discontinuedMedications.length === 0 ? (
                  <p className="text-sm text-gray-500">No discontinued medications</p>
                ) : (
                  <div className="space-y-3">
                    {discontinuedMedications.map((medication) => (
                      <div key={medication.id.toString()} className="rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-75">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-700 line-through">{medication.name}</p>
                            <p className="text-sm text-gray-600">
                              {medication.dosage} - {medication.dosageQuantity}
                            </p>
                            <p className="text-sm text-gray-600">Route: {medication.administrationRoute}</p>
                            {medication.prescribingPhysician && (
                              <p className="text-sm text-gray-500">
                                Prescribed by: {medication.prescribingPhysician.name}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartMedication(medication.id)}
                            disabled={updateMedicationStatus.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Syringe className="h-5 w-5" />
                    Medication Administration Records
                  </CardTitle>
                  <Button onClick={() => setShowMarDialog(true)} size="sm">
                    Add MAR Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {marRecords.length === 0 ? (
                  <p className="text-sm text-gray-500">No MAR records</p>
                ) : (
                  <div className="space-y-3">
                    {marRecords.slice(0, 10).map((record) => (
                      <div key={record.id.toString()} className="rounded-lg border border-gray-200 p-3">
                        <p className="font-medium text-gray-900">{record.medication.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(record.administrationTime)}
                        </p>
                        <p className="text-sm text-gray-600">Administered by: {record.administeredBy}</p>
                        {record.notes && (
                          <p className="text-sm text-gray-500">Notes: {record.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activities of Daily Living
                  </CardTitle>
                  <Button onClick={() => setShowAdlDialog(true)} size="sm">
                    Add ADL Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {adlRecords.length === 0 ? (
                  <p className="text-sm text-gray-500">No ADL records</p>
                ) : (
                  <div className="space-y-3">
                    {adlRecords.slice(0, 10).map((record) => (
                      <div key={record.id.toString()} className="rounded-lg border border-gray-200 p-3">
                        <p className="font-medium text-gray-900">{record.activity}</p>
                        <p className="text-sm text-gray-600">{formatDate(record.date)}</p>
                        <p className="text-sm text-gray-600">
                          Assistance Level: {record.assistanceLevel}
                        </p>
                        {record.staffNotes && (
                          <p className="text-sm text-gray-500">Notes: {record.staffNotes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vitals & Weight Tab */}
          <TabsContent value="vitals" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    Daily Vitals
                  </CardTitle>
                  <Button onClick={() => setShowDailyVitalsDialog(true)} size="sm">
                    Add Vitals
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sortedDailyVitals.length === 0 ? (
                  <p className="text-sm text-gray-500">No vitals recorded</p>
                ) : (
                  <div className="space-y-3">
                    {sortedDailyVitals.slice(0, 10).map((vitals) => (
                      <div key={vitals.id.toString()} className="rounded-lg border border-gray-200 p-3">
                        <p className="font-medium text-gray-900">
                          {formatDateTime(vitals.measurementDateTime)}
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Temp:</span>{' '}
                            <span className="text-gray-900">{vitals.temperature}°F</span>
                          </div>
                          <div>
                            <span className="text-gray-600">BP:</span>{' '}
                            <span className="text-gray-900">
                              {vitals.bloodPressureSystolic.toString()}/{vitals.bloodPressureDiastolic.toString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Pulse:</span>{' '}
                            <span className="text-gray-900">{vitals.pulseRate.toString()} bpm</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Resp:</span>{' '}
                            <span className="text-gray-900">{vitals.respiratoryRate.toString()}/min</span>
                          </div>
                          <div>
                            <span className="text-gray-600">O2 Sat:</span>{' '}
                            <span className="text-gray-900">{vitals.oxygenSaturation.toString()}%</span>
                          </div>
                          {vitals.bloodGlucose && (
                            <div>
                              <span className="text-gray-600">Glucose:</span>{' '}
                              <span className="text-gray-900">{vitals.bloodGlucose.toString()} mg/dL</span>
                            </div>
                          )}
                        </div>
                        {vitals.notes && (
                          <p className="mt-2 text-sm text-gray-500">Notes: {vitals.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Droplet className="h-5 w-5" />
                    Weight Log
                  </CardTitle>
                  <Button onClick={() => setShowWeightDialog(true)} size="sm">
                    Add Weight
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sortedWeightLog.length === 0 ? (
                  <p className="text-sm text-gray-500">No weight entries</p>
                ) : (
                  <div className="space-y-3">
                    {sortedWeightLog.slice(0, 10).map((entry) => (
                      <div key={entry.id.toString()} className="rounded-lg border border-gray-200 p-3">
                        <p className="font-medium text-gray-900">
                          {entry.weight} {entry.weightUnit}
                        </p>
                        <p className="text-sm text-gray-600">{formatDate(entry.measurementDate)}</p>
                        {entry.notes && (
                          <p className="text-sm text-gray-500">Notes: {entry.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {showEditDialog && (
        <EditResidentDialog
          resident={resident}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
      {showMarDialog && (
        <AddMarRecordDialog
          resident={resident}
          open={showMarDialog}
          onOpenChange={setShowMarDialog}
        />
      )}
      {showAdlDialog && (
        <AddAdlRecordDialog
          resident={resident}
          open={showAdlDialog}
          onOpenChange={setShowAdlDialog}
        />
      )}
      {showMedicationDialog && (
        <AddMedicationDialog
          resident={resident}
          open={showMedicationDialog}
          onOpenChange={setShowMedicationDialog}
        />
      )}
      {showEditMedicationDialog && selectedMedication && (
        <EditMedicationDialog
          resident={resident}
          medication={selectedMedication}
          open={showEditMedicationDialog}
          onOpenChange={setShowEditMedicationDialog}
        />
      )}
      {showDailyVitalsDialog && (
        <AddDailyVitalsDialog
          resident={resident}
          open={showDailyVitalsDialog}
          onOpenChange={setShowDailyVitalsDialog}
        />
      )}
      {showWeightDialog && (
        <AddWeightEntryDialog
          resident={resident}
          open={showWeightDialog}
          onOpenChange={setShowWeightDialog}
        />
      )}
    </div>
  );
}
