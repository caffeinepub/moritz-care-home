import { useState, useEffect } from 'react';
import { useUpdateResident, useIsCallerAdmin } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { dateToBackendTimestamp, backendTimestampToDate } from '../lib/dateUtils';
import { mapRoomTypeToBackend, mapRoomTypeFromBackend, mapResidentStatusFromBackend } from '../lib/residentEnumMapping';
import type { Resident, Physician, Pharmacy, Insurance, ResponsiblePerson } from '../backend';

interface EditResidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: Resident;
}

/**
 * Comprehensive dialog form for editing all resident information with admin-only access guard, pre-filled data, using string-based Select values converted to backend enum types at submit time, with proper error handling and toast notifications.
 */
export default function EditResidentDialog({ open, onOpenChange, resident }: EditResidentDialogProps) {
  const updateResident = useUpdateResident();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  // Basic Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<string>('solo');
  const [bed, setBed] = useState('');
  const [medicaidNumber, setMedicaidNumber] = useState('');
  const [medicareNumber, setMedicareNumber] = useState('');

  // Physicians
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [physicianName, setPhysicianName] = useState('');
  const [physicianContact, setPhysicianContact] = useState('');
  const [physicianSpecialty, setPhysicianSpecialty] = useState('');

  // Pharmacy
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [pharmacyContact, setPharmacyContact] = useState('');

  // Insurance
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [insuranceAddress, setInsuranceAddress] = useState('');
  const [insuranceContact, setInsuranceContact] = useState('');

  // Responsible Persons
  const [responsiblePersons, setResponsiblePersons] = useState<ResponsiblePerson[]>([]);
  const [personName, setPersonName] = useState('');
  const [personRelationship, setPersonRelationship] = useState('');
  const [personContact, setPersonContact] = useState('');
  const [personAddress, setPersonAddress] = useState('');

  // Pre-fill form when resident changes
  useEffect(() => {
    if (resident) {
      setFirstName(resident.firstName);
      setLastName(resident.lastName);
      setDateOfBirth(backendTimestampToDate(resident.dateOfBirth));
      setAdmissionDate(backendTimestampToDate(resident.admissionDate));
      setRoomNumber(resident.roomNumber);
      setRoomType(mapRoomTypeFromBackend(resident.roomType));
      setBed(resident.bed || '');
      setMedicaidNumber(resident.medicaidNumber);
      setMedicareNumber(resident.medicareNumber);
      setPhysicians(resident.physicians);
      setResponsiblePersons(resident.responsiblePersons);

      if (resident.pharmacy) {
        setPharmacyName(resident.pharmacy.name);
        setPharmacyAddress(resident.pharmacy.address);
        setPharmacyContact(resident.pharmacy.contactNumber);
      } else {
        setPharmacyName('');
        setPharmacyAddress('');
        setPharmacyContact('');
      }

      if (resident.insurance) {
        setInsuranceCompany(resident.insurance.companyName);
        setPolicyNumber(resident.insurance.policyNumber);
        setInsuranceAddress(resident.insurance.address);
        setInsuranceContact(resident.insurance.contactNumber);
      } else {
        setInsuranceCompany('');
        setPolicyNumber('');
        setInsuranceAddress('');
        setInsuranceContact('');
      }
    }
  }, [resident]);

  const addPhysician = () => {
    if (!physicianName || !physicianContact || !physicianSpecialty) {
      toast.error('Please fill in all physician fields');
      return;
    }

    const newPhysician: Physician = {
      id: BigInt(Date.now()),
      name: physicianName,
      contactNumber: physicianContact,
      specialty: physicianSpecialty,
    };

    setPhysicians([...physicians, newPhysician]);
    setPhysicianName('');
    setPhysicianContact('');
    setPhysicianSpecialty('');
    toast.success('Physician added');
  };

  const removePhysician = (id: bigint) => {
    setPhysicians(physicians.filter((p) => p.id !== id));
  };

  const addResponsiblePerson = () => {
    if (!personName || !personRelationship || !personContact || !personAddress) {
      toast.error('Please fill in all responsible person fields');
      return;
    }

    const newPerson: ResponsiblePerson = {
      id: BigInt(Date.now()),
      name: personName,
      relationship: personRelationship,
      contactNumber: personContact,
      address: personAddress,
    };

    setResponsiblePersons([...responsiblePersons, newPerson]);
    setPersonName('');
    setPersonRelationship('');
    setPersonContact('');
    setPersonAddress('');
    toast.success('Responsible person added');
  };

  const removeResponsiblePerson = (id: bigint) => {
    setResponsiblePersons(responsiblePersons.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Admin guard
    if (!isAdmin) {
      toast.error('You do not have permission to edit residents. Only administrators can perform this action.');
      return;
    }

    if (!firstName || !lastName || !dateOfBirth || !admissionDate || !roomNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const pharmacy: Pharmacy | null = pharmacyName
        ? {
            id: resident.pharmacy?.id || BigInt(Date.now()),
            name: pharmacyName,
            address: pharmacyAddress,
            contactNumber: pharmacyContact,
          }
        : null;

      const insurance: Insurance | null = insuranceCompany
        ? {
            id: resident.insurance?.id || BigInt(Date.now()),
            companyName: insuranceCompany,
            policyNumber,
            address: insuranceAddress,
            contactNumber: insuranceContact,
          }
        : null;

      await updateResident.mutateAsync({
        id: resident.id,
        firstName,
        lastName,
        dateOfBirth: dateToBackendTimestamp(dateOfBirth),
        admissionDate: dateToBackendTimestamp(admissionDate),
        status: resident.status,
        roomNumber,
        roomType: mapRoomTypeToBackend(roomType),
        bed: bed || null,
        physicians,
        pharmacy,
        insurance,
        medicaidNumber,
        medicareNumber,
        responsiblePersons,
        medications: resident.medications,
      });

      toast.success('Resident updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating resident:', error);
      const message = error instanceof Error ? error.message : 'Failed to update resident. Please try again.';
      toast.error(message);
    }
  };

  // Show warning if dialog is opened without admin access
  if (!adminLoading && !isAdmin && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </DialogTitle>
            <DialogDescription>
              You do not have permission to edit residents. Only administrators can perform this action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resident</DialogTitle>
          <DialogDescription>Update the resident's information below</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="physicians">Physicians</TabsTrigger>
              <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admissionDate">Admission Date *</Label>
                  <Input
                    id="admissionDate"
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">Room Number *</Label>
                  <Input
                    id="roomNumber"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Type *</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger id="roomType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="sharedRoom">Shared Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bed">Bed</Label>
                  <Input id="bed" value={bed} onChange={(e) => setBed(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicaidNumber">Medicaid Number</Label>
                  <Input
                    id="medicaidNumber"
                    value={medicaidNumber}
                    onChange={(e) => setMedicaidNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicareNumber">Medicare Number</Label>
                  <Input
                    id="medicareNumber"
                    value={medicareNumber}
                    onChange={(e) => setMedicareNumber(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="physicians" className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="physicianName">Physician Name</Label>
                    <Input
                      id="physicianName"
                      value={physicianName}
                      onChange={(e) => setPhysicianName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="physicianContact">Contact Number</Label>
                    <Input
                      id="physicianContact"
                      value={physicianContact}
                      onChange={(e) => setPhysicianContact(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="physicianSpecialty">Specialty</Label>
                    <Input
                      id="physicianSpecialty"
                      value={physicianSpecialty}
                      onChange={(e) => setPhysicianSpecialty(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="button" onClick={addPhysician} variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Physician
                </Button>
              </div>

              {physicians.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Physicians</Label>
                  {physicians.map((physician) => (
                    <Card key={physician.id.toString()}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{physician.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {physician.specialty} - {physician.contactNumber}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePhysician(physician.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pharmacy" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pharmacyName">Pharmacy Name</Label>
                  <Input
                    id="pharmacyName"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacyContact">Contact Number</Label>
                  <Input
                    id="pharmacyContact"
                    value={pharmacyContact}
                    onChange={(e) => setPharmacyContact(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="pharmacyAddress">Address</Label>
                  <Input
                    id="pharmacyAddress"
                    value={pharmacyAddress}
                    onChange={(e) => setPharmacyAddress(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insurance" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="insuranceCompany">Company Name</Label>
                  <Input
                    id="insuranceCompany"
                    value={insuranceCompany}
                    onChange={(e) => setInsuranceCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input
                    id="policyNumber"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceAddress">Address</Label>
                  <Input
                    id="insuranceAddress"
                    value={insuranceAddress}
                    onChange={(e) => setInsuranceAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceContact">Contact Number</Label>
                  <Input
                    id="insuranceContact"
                    value={insuranceContact}
                    onChange={(e) => setInsuranceContact(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="personName">Name</Label>
                    <Input
                      id="personName"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personRelationship">Relationship</Label>
                    <Input
                      id="personRelationship"
                      value={personRelationship}
                      onChange={(e) => setPersonRelationship(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personContact">Contact Number</Label>
                    <Input
                      id="personContact"
                      value={personContact}
                      onChange={(e) => setPersonContact(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personAddress">Address</Label>
                    <Input
                      id="personAddress"
                      value={personAddress}
                      onChange={(e) => setPersonAddress(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addResponsiblePerson}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Responsible Person
                </Button>
              </div>

              {responsiblePersons.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Responsible Persons</Label>
                  {responsiblePersons.map((person) => (
                    <Card key={person.id.toString()}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {person.relationship} - {person.contactNumber}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeResponsiblePerson(person.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateResident.isPending || adminLoading || !isAdmin}>
              {updateResident.isPending ? 'Updating...' : 'Update Resident'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
