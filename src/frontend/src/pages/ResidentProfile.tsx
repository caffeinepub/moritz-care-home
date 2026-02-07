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
          <h2>Resident Profile Report</h2>
        </div>

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
          </div>
        </div>

        <div className="print-section">
          <h3>Insurance Information</h3>
          <div className="print-grid">
            <div className="print-field">
              <span className="print-label">Insurance Company:</span>
              <span className="print-value">{resident.insurance?.companyName || 'N/A'}</span>
            </div>
            <div className="print-field">
              <span className="print-label">Policy Number:</span>
              <span className="print-value">{resident.insurance?.policyNumber || 'N/A'}</span>
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
                  <tr key={medication.id.toString()} className="discontinued-medication">
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

        <div className="print-section">
          <h3>Physicians</h3>
          {physicians.length === 0 ? (
            <p className="print-empty">No physicians assigned</p>
          ) : (
            <div className="print-list">
              {physicians.map((physician) => (
                <div key={physician.id.toString()} className="print-list-item">
                  <strong>{physician.name}</strong>
                  <div className="print-contact">
                    Specialty: {physician.specialty}
                  </div>
                  <div className="print-contact">
                    Contact: {physician.contactNumber}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="print-section">
          <h3>Pharmacy</h3>
          {resident.pharmacy ? (
            <div className="print-list-item">
              <strong>{resident.pharmacy.name}</strong>
              <div className="print-contact">
                Address: {resident.pharmacy.address}
              </div>
              <div className="print-contact">
                Contact: {resident.pharmacy.contactNumber}
              </div>
            </div>
          ) : (
            <p className="print-empty">No pharmacy assigned</p>
          )}
        </div>

        <div className="print-section">
          <h3>Responsible Persons</h3>
          {responsiblePersons.length === 0 ? (
            <p className="print-empty">No responsible persons listed</p>
          ) : (
            <div className="print-list">
              {responsiblePersons.map((person) => (
                <div key={person.id.toString()} className="print-list-item">
                  <strong>{person.name}</strong>
                  <div className="print-contact">
                    Relationship: {person.relationship}
                  </div>
                  <div className="print-contact">
                    Contact: {person.contactNumber}
                  </div>
                  <div className="print-contact">
                    Address: {person.address}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {includeSignature && (
          <div className="print-signature-section">
            <h3>Physician Signature</h3>
            <div className="print-signature-block">
              <div className="print-signature-line">
                <span className="print-label">Physician Name (Printed):</span>
                <div className="print-signature-underline"></div>
              </div>
              <div className="print-signature-line">
                <span className="print-label">Physician Signature:</span>
                <div className="print-signature-underline"></div>
              </div>
              <div className="print-signature-line">
                <span className="print-label">Date:</span>
                <div className="print-signature-underline"></div>
              </div>
            </div>
          </div>
        )}

        <div className="print-footer">
          <p>© 2026. Built with love using caffeine.ai</p>
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 print:bg-white">
      <div className="no-print">
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/' })}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-3">
                  <BrandLogo size="sm" />
                  <h1 className="text-2xl font-bold text-gray-900">Resident Profile</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="include-signature"
                    checked={includeSignature}
                    onCheckedChange={setIncludeSignature}
                  />
                  <Label htmlFor="include-signature" className="text-sm font-medium cursor-pointer">
                    Include Signature Section
                  </Label>
                </div>
                <Button onClick={handlePrint} className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Profile
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Resident Header Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                    <User className="h-8 w-8 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl">
                      {resident.firstName} {resident.lastName}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-4 text-base">
                      <span className="flex items-center gap-1">
                        <DoorOpen className="h-4 w-4" />
                        {formatRoomDisplay(resident)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Age: {age} years
                      </span>
                      <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Active' : 'Discharged'}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={() => setShowEditDialog(true)} variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Resident
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="mar">MAR</TabsTrigger>
              <TabsTrigger value="adl">ADL</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="weight">Weight</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                      <span className="text-sm text-gray-900">{formatDate(resident.dateOfBirth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Admission Date:</span>
                      <span className="text-sm text-gray-900">{formatDate(resident.admissionDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Room Type:</span>
                      <span className="text-sm text-gray-900">
                        {resident.roomType === RoomType.solo ? 'Solo' : 'Shared Room'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Resident ID:</span>
                      <span className="text-sm text-gray-900">{resident.id.toString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Insurance Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Insurance Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Insurance Company:</span>
                      <span className="text-sm text-gray-900">{resident.insurance?.companyName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Policy Number:</span>
                      <span className="text-sm text-gray-900">{resident.insurance?.policyNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Medicaid Number:</span>
                      <span className="text-sm text-gray-900">{resident.medicaidNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Medicare Number:</span>
                      <span className="text-sm text-gray-900">{resident.medicareNumber || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                    <div className="space-y-4">
                      {physicians.map((physician) => (
                        <div key={physician.id.toString()} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{physician.name}</p>
                              <p className="text-sm text-gray-500">{physician.specialty}</p>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Phone className="h-4 w-4" />
                              {physician.contactNumber}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pharmacy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Pharmacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {resident.pharmacy ? (
                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="font-medium text-gray-900">{resident.pharmacy.name}</p>
                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {resident.pharmacy.address}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {resident.pharmacy.contactNumber}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No pharmacy assigned</p>
                  )}
                </CardContent>
              </Card>

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
                    <div className="space-y-4">
                      {responsiblePersons.map((person) => (
                        <div key={person.id.toString()} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{person.name}</p>
                              <p className="text-sm text-gray-500">{person.relationship}</p>
                            </div>
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {person.contactNumber}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {person.address}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Medications Tab */}
            <TabsContent value="medications" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Active Medications
                    </CardTitle>
                    <Button onClick={() => setShowMedicationDialog(true)} size="sm">
                      <Pill className="mr-2 h-4 w-4" />
                      Add Medication
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeMedications.length === 0 ? (
                    <p className="text-sm text-gray-500">No active medications</p>
                  ) : (
                    <div className="space-y-4">
                      {activeMedications.map((medication) => (
                        <div key={medication.id.toString()} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{medication.name}</p>
                                <Badge variant="default">Active</Badge>
                              </div>
                              <div className="mt-2 grid gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Dosage:</span>
                                  <span>{medication.dosage}</span>
                                  {medication.dosageQuantity && <span>({medication.dosageQuantity})</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Route:</span>
                                  <span className="capitalize">{medication.administrationRoute}</span>
                                </div>
                                {medication.administrationTimes.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Times:</span>
                                    <span>{medication.administrationTimes.join(', ')}</span>
                                  </div>
                                )}
                                {medication.prescribingPhysician && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Physician:</span>
                                    <span>{medication.prescribingPhysician.name}</span>
                                  </div>
                                )}
                                {medication.notes && (
                                  <div className="flex items-start gap-2">
                                    <span className="font-medium">Notes:</span>
                                    <span>{medication.notes}</span>
                                  </div>
                                )}
                              </div>
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

              {discontinuedMedications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Discontinued Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {discontinuedMedications.map((medication) => (
                        <div key={medication.id.toString()} className="rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-60">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 line-through">{medication.name}</p>
                                <Badge variant="secondary">Discontinued</Badge>
                              </div>
                              <div className="mt-2 grid gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Dosage:</span>
                                  <span>{medication.dosage}</span>
                                  {medication.dosageQuantity && <span>({medication.dosageQuantity})</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Route:</span>
                                  <span className="capitalize">{medication.administrationRoute}</span>
                                </div>
                              </div>
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
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* MAR Tab */}
            <TabsContent value="mar" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Syringe className="h-5 w-5" />
                      Medication Administration Records
                    </CardTitle>
                    <Button onClick={() => setShowMarDialog(true)} size="sm">
                      <Syringe className="mr-2 h-4 w-4" />
                      Add MAR Record
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {marRecords.length === 0 ? (
                    <p className="text-sm text-gray-500">No MAR records</p>
                  ) : (
                    <div className="space-y-4">
                      {marRecords.map((record) => (
                        <div key={record.id.toString()} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{record.medication.name}</p>
                              <p className="text-sm text-gray-500">{record.medication.dosage}</p>
                            </div>
                            <Badge variant="outline">{formatDateTime(record.administrationTime)}</Badge>
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Administered by:</span>
                              <span>{record.administeredBy}</span>
                            </div>
                            {record.notes && (
                              <div className="flex items-start gap-2">
                                <span className="font-medium">Notes:</span>
                                <span>{record.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ADL Tab */}
            <TabsContent value="adl" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Activities of Daily Living
                    </CardTitle>
                    <Button onClick={() => setShowAdlDialog(true)} size="sm">
                      <Activity className="mr-2 h-4 w-4" />
                      Add ADL Record
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {adlRecords.length === 0 ? (
                    <p className="text-sm text-gray-500">No ADL records</p>
                  ) : (
                    <div className="space-y-4">
                      {adlRecords.map((record) => (
                        <div key={record.id.toString()} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{record.activity}</p>
                              <p className="text-sm text-gray-500">{record.assistanceLevel}</p>
                            </div>
                            <Badge variant="outline">{formatDate(record.date)}</Badge>
                          </div>
                          {record.staffNotes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {record.staffNotes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vitals Tab */}
            <TabsContent value="vitals" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Daily Vitals
                    </CardTitle>
                    <Button onClick={() => setShowDailyVitalsDialog(true)} size="sm">
                      <Thermometer className="mr-2 h-4 w-4" />
                      Add Vitals
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sortedDailyVitals.length === 0 ? (
                    <p className="text-sm text-gray-500">No vitals recorded</p>
                  ) : (
                    <div className="space-y-4">
                      {sortedDailyVitals.map((vitals) => (
                        <div key={vitals.id.toString()} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{formatDateTime(vitals.measurementDateTime)}</Badge>
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                                <div>
                                  <span className="font-medium text-gray-500">Temperature:</span>
                                  <p className="text-gray-900">{vitals.temperature.toFixed(1)}°F</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Blood Pressure:</span>
                                  <p className="text-gray-900">{vitals.bloodPressureSystolic.toString()}/{vitals.bloodPressureDiastolic.toString()}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Pulse:</span>
                                  <p className="text-gray-900">{vitals.pulseRate.toString()} bpm</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Respiratory Rate:</span>
                                  <p className="text-gray-900">{vitals.respiratoryRate.toString()} /min</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">O2 Saturation:</span>
                                  <p className="text-gray-900">{vitals.oxygenSaturation.toString()}%</p>
                                </div>
                                {vitals.bloodGlucose && (
                                  <div>
                                    <span className="font-medium text-gray-500">Blood Glucose:</span>
                                    <p className="text-gray-900">{vitals.bloodGlucose.toString()} mg/dL</p>
                                  </div>
                                )}
                              </div>
                              {vitals.notes && (
                                <div className="mt-3 text-sm text-gray-600">
                                  <span className="font-medium">Notes:</span> {vitals.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Weight Tab */}
            <TabsContent value="weight" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Droplet className="h-5 w-5" />
                      Weight Log
                    </CardTitle>
                    <Button onClick={() => setShowWeightDialog(true)} size="sm">
                      <Droplet className="mr-2 h-4 w-4" />
                      Add Weight
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sortedWeightLog.length === 0 ? (
                    <p className="text-sm text-gray-500">No weight entries recorded</p>
                  ) : (
                    <div className="space-y-4">
                      {sortedWeightLog.map((entry) => (
                        <div key={entry.id.toString()} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{formatDate(entry.measurementDate)}</Badge>
                              </div>
                              <div className="mt-2 text-sm">
                                <span className="font-medium text-gray-500">Weight:</span>
                                <p className="text-lg font-semibold text-gray-900">
                                  {entry.weight.toFixed(1)} {entry.weightUnit}
                                </p>
                              </div>
                              {entry.notes && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Notes:</span> {entry.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Dialogs */}
      <EditResidentDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        resident={resident}
      />
      <AddMarRecordDialog
        open={showMarDialog}
        onOpenChange={setShowMarDialog}
        resident={resident}
      />
      <AddAdlRecordDialog
        open={showAdlDialog}
        onOpenChange={setShowAdlDialog}
        resident={resident}
      />
      <AddMedicationDialog
        open={showMedicationDialog}
        onOpenChange={setShowMedicationDialog}
        resident={resident}
      />
      {selectedMedication && (
        <EditMedicationDialog
          open={showEditMedicationDialog}
          onOpenChange={setShowEditMedicationDialog}
          resident={resident}
          medication={selectedMedication}
        />
      )}
      <AddDailyVitalsDialog
        open={showDailyVitalsDialog}
        onOpenChange={setShowDailyVitalsDialog}
        resident={resident}
      />
      <AddWeightEntryDialog
        open={showWeightDialog}
        onOpenChange={setShowWeightDialog}
        resident={resident}
      />
    </div>
  );
}
