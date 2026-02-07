import { useState } from 'react';
import { useAddResident } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { dateStringToNanoseconds } from '../lib/dateUtils';
import type { Physician, Pharmacy, Insurance, ResponsiblePerson, Medication } from '../backend';
import { MedicationStatus, RoomType, AdministrationRoute } from '../backend';

interface AddResidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddResidentDialog({ open, onOpenChange }: AddResidentDialogProps) {
  // Basic Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<RoomType>(RoomType.solo);
  const [bed, setBed] = useState('A');
  const [medicaidNumber, setMedicaidNumber] = useState('');
  const [medicareNumber, setMedicareNumber] = useState('');

  // Physicians - support multiple
  const [physicians, setPhysicians] = useState<Array<{ name: string; contactNumber: string; specialty: string }>>([
    { name: '', contactNumber: '', specialty: '' },
  ]);

  // Pharmacy - single
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [pharmacyContact, setPharmacyContact] = useState('');

  // Insurance - single
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [insuranceAddress, setInsuranceAddress] = useState('');
  const [insuranceContact, setInsuranceContact] = useState('');

  // Responsible Persons - support multiple
  const [responsiblePersons, setResponsiblePersons] = useState<
    Array<{ name: string; relationship: string; contactNumber: string; address: string }>
  >([{ name: '', relationship: '', contactNumber: '', address: '' }]);

  // Medications - support multiple
  const [medications, setMedications] = useState<
    Array<{
      name: string;
      dosage: string;
      administrationTimes: string;
      prescribingPhysicianName: string;
    }>
  >([{ name: '', dosage: '', administrationTimes: '', prescribingPhysicianName: '' }]);

  const addResident = useAddResident();

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setAdmissionDate('');
    setRoomNumber('');
    setRoomType(RoomType.solo);
    setBed('A');
    setMedicaidNumber('');
    setMedicareNumber('');
    setPhysicians([{ name: '', contactNumber: '', specialty: '' }]);
    setPharmacyName('');
    setPharmacyAddress('');
    setPharmacyContact('');
    setInsuranceCompany('');
    setPolicyNumber('');
    setInsuranceAddress('');
    setInsuranceContact('');
    setResponsiblePersons([{ name: '', relationship: '', contactNumber: '', address: '' }]);
    setMedications([{ name: '', dosage: '', administrationTimes: '', prescribingPhysicianName: '' }]);
  };

  // Physician handlers
  const addPhysician = () => {
    setPhysicians([...physicians, { name: '', contactNumber: '', specialty: '' }]);
  };

  const removePhysician = (index: number) => {
    if (physicians.length > 1) {
      setPhysicians(physicians.filter((_, i) => i !== index));
    }
  };

  const updatePhysician = (index: number, field: string, value: string) => {
    const updated = [...physicians];
    updated[index] = { ...updated[index], [field]: value };
    setPhysicians(updated);
  };

  // Responsible Person handlers
  const addResponsiblePerson = () => {
    setResponsiblePersons([...responsiblePersons, { name: '', relationship: '', contactNumber: '', address: '' }]);
  };

  const removeResponsiblePerson = (index: number) => {
    if (responsiblePersons.length > 1) {
      setResponsiblePersons(responsiblePersons.filter((_, i) => i !== index));
    }
  };

  const updateResponsiblePerson = (index: number, field: string, value: string) => {
    const updated = [...responsiblePersons];
    updated[index] = { ...updated[index], [field]: value };
    setResponsiblePersons(updated);
  };

  // Medication handlers
  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', administrationTimes: '', prescribingPhysicianName: '' }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !dateOfBirth || !admissionDate || !roomNumber) {
      toast.error('Please fill in all required fields (First Name, Last Name, Date of Birth, Admission Date, Room Number)');
      return;
    }

    // Validate bed assignment for shared rooms
    if (roomType === RoomType.sharedRoom && !bed) {
      toast.error('Please select a bed assignment for shared rooms');
      return;
    }

    try {
      // Convert dates using utility function to avoid timezone issues
      const dobNanoseconds = dateStringToNanoseconds(dateOfBirth);
      const admNanoseconds = dateStringToNanoseconds(admissionDate);

      // Build physicians array - only include those with a name
      const physiciansData: Physician[] = physicians
        .filter((p) => p.name.trim() !== '')
        .map((p, index) => ({
          id: BigInt(0),
          name: p.name,
          contactNumber: p.contactNumber || 'Not provided',
          specialty: p.specialty || 'General',
        }));

      // Build pharmacy object - use null if not provided
      const pharmacyData: Pharmacy | null = pharmacyName.trim()
        ? {
            id: BigInt(0),
            name: pharmacyName,
            address: pharmacyAddress || 'Not specified',
            contactNumber: pharmacyContact || 'Not specified',
          }
        : null;

      // Build insurance object - use null if not provided
      const insuranceData: Insurance | null = insuranceCompany.trim()
        ? {
            id: BigInt(0),
            companyName: insuranceCompany,
            policyNumber: policyNumber || 'Not specified',
            address: insuranceAddress || 'Not specified',
            contactNumber: insuranceContact || 'Not specified',
          }
        : null;

      // Build responsible persons array - only include those with a name
      const responsiblePersonsData: ResponsiblePerson[] = responsiblePersons
        .filter((rp) => rp.name.trim() !== '')
        .map((rp, index) => ({
          id: BigInt(0),
          name: rp.name,
          relationship: rp.relationship || 'Not specified',
          contactNumber: rp.contactNumber || 'Not provided',
          address: rp.address || 'Not specified',
        }));

      // Build medications array - only include those with a name
      const medicationsData: Medication[] = medications
        .filter((m) => m.name.trim() !== '')
        .map((m, index) => {
          // Find matching physician for this medication
          const prescribingPhysician = physiciansData.find(
            (p) => p.name.toLowerCase() === m.prescribingPhysicianName.toLowerCase()
          );

          return {
            id: BigInt(0),
            name: m.name,
            dosage: m.dosage || 'As prescribed',
            administrationTimes: m.administrationTimes
              ? m.administrationTimes.split(',').map((t) => t.trim())
              : [],
            prescribingPhysician: prescribingPhysician || undefined,
            administrationRoute: AdministrationRoute.oral,
            dosageQuantity: '',
            notes: '',
            status: MedicationStatus.active,
          };
        });

      await addResident.mutateAsync({
        firstName,
        lastName,
        dateOfBirth: dobNanoseconds,
        admissionDate: admNanoseconds,
        roomNumber,
        roomType,
        bed: roomType === RoomType.sharedRoom ? bed : null,
        physiciansData,
        pharmacyData,
        insuranceData,
        medicaidNumber: medicaidNumber || 'N/A',
        medicareNumber: medicareNumber || 'N/A',
        responsiblePersonsData,
        medications: medicationsData,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding resident:', error);
      // Error toast is already handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl bg-white border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Resident</DialogTitle>
          <DialogDescription className="text-muted-foreground">Enter the resident's information below. Fields marked with * are required.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="bg-white border-input text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="bg-white border-input text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-foreground">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    className="bg-white border-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admissionDate" className="text-foreground">
                    Admission Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="admissionDate"
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    required
                    className="bg-white border-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomNumber" className="text-foreground">
                    Room Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="roomNumber"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="101"
                    required
                    className="bg-white border-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomType" className="text-foreground">
                    Room Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={roomType} onValueChange={(value) => setRoomType(value as RoomType)}>
                    <SelectTrigger id="roomType" className="bg-white border-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value={RoomType.solo}>Solo</SelectItem>
                      <SelectItem value={RoomType.sharedRoom}>Shared Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {roomType === RoomType.sharedRoom && (
                  <div className="space-y-2">
                    <Label htmlFor="bed" className="text-foreground">
                      Bed <span className="text-red-500">*</span>
                    </Label>
                    <Select value={bed} onValueChange={setBed}>
                      <SelectTrigger id="bed" className="bg-white border-input text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="medicaidNumber" className="text-foreground">
                    Medicaid Number
                  </Label>
                  <Input id="medicaidNumber" value={medicaidNumber} onChange={(e) => setMedicaidNumber(e.target.value)} className="bg-white border-input text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicareNumber" className="text-foreground">
                    Medicare Number
                  </Label>
                  <Input id="medicareNumber" value={medicareNumber} onChange={(e) => setMedicareNumber(e.target.value)} className="bg-white border-input text-foreground" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Physicians */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Physicians</h3>
                <Button type="button" variant="outline" size="sm" onClick={addPhysician} className="bg-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Physician
                </Button>
              </div>
              {physicians.map((physician, index) => (
                <div key={index} className="space-y-4 rounded-lg border border-border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Physician {index + 1}</span>
                    {physicians.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removePhysician(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`physician-name-${index}`} className="text-foreground">
                        Name
                      </Label>
                      <Input
                        id={`physician-name-${index}`}
                        value={physician.name}
                        onChange={(e) => updatePhysician(index, 'name', e.target.value)}
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`physician-contact-${index}`} className="text-foreground">
                        Contact Number
                      </Label>
                      <Input
                        id={`physician-contact-${index}`}
                        value={physician.contactNumber}
                        onChange={(e) => updatePhysician(index, 'contactNumber', e.target.value)}
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`physician-specialty-${index}`} className="text-foreground">
                        Specialty
                      </Label>
                      <Input
                        id={`physician-specialty-${index}`}
                        value={physician.specialty}
                        onChange={(e) => updatePhysician(index, 'specialty', e.target.value)}
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Pharmacy */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Pharmacy</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pharmacyName" className="text-foreground">
                    Name
                  </Label>
                  <Input id="pharmacyName" value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} className="bg-white border-input text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacyAddress" className="text-foreground">
                    Address
                  </Label>
                  <Input id="pharmacyAddress" value={pharmacyAddress} onChange={(e) => setPharmacyAddress(e.target.value)} className="bg-white border-input text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacyContact" className="text-foreground">
                    Contact Number
                  </Label>
                  <Input id="pharmacyContact" value={pharmacyContact} onChange={(e) => setPharmacyContact(e.target.value)} className="bg-white border-input text-foreground" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Insurance */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Insurance</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="insuranceCompany" className="text-foreground">
                    Company Name
                  </Label>
                  <Input id="insuranceCompany" value={insuranceCompany} onChange={(e) => setInsuranceCompany(e.target.value)} className="bg-white border-input text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policyNumber" className="text-foreground">
                    Policy Number
                  </Label>
                  <Input id="policyNumber" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} className="bg-white border-input text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceAddress" className="text-foreground">
                    Address
                  </Label>
                  <Input id="insuranceAddress" value={insuranceAddress} onChange={(e) => setInsuranceAddress(e.target.value)} className="bg-white border-input text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceContact" className="text-foreground">
                    Contact Number
                  </Label>
                  <Input id="insuranceContact" value={insuranceContact} onChange={(e) => setInsuranceContact(e.target.value)} className="bg-white border-input text-foreground" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Responsible Persons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Responsible Persons</h3>
                <Button type="button" variant="outline" size="sm" onClick={addResponsiblePerson} className="bg-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Person
                </Button>
              </div>
              {responsiblePersons.map((person, index) => (
                <div key={index} className="space-y-4 rounded-lg border border-border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Person {index + 1}</span>
                    {responsiblePersons.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeResponsiblePerson(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`person-name-${index}`} className="text-foreground">
                        Name
                      </Label>
                      <Input
                        id={`person-name-${index}`}
                        value={person.name}
                        onChange={(e) => updateResponsiblePerson(index, 'name', e.target.value)}
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`person-relationship-${index}`} className="text-foreground">
                        Relationship
                      </Label>
                      <Input
                        id={`person-relationship-${index}`}
                        value={person.relationship}
                        onChange={(e) => updateResponsiblePerson(index, 'relationship', e.target.value)}
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`person-contact-${index}`} className="text-foreground">
                        Contact Number
                      </Label>
                      <Input
                        id={`person-contact-${index}`}
                        value={person.contactNumber}
                        onChange={(e) => updateResponsiblePerson(index, 'contactNumber', e.target.value)}
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`person-address-${index}`} className="text-foreground">
                        Address
                      </Label>
                      <Input
                        id={`person-address-${index}`}
                        value={person.address}
                        onChange={(e) => updateResponsiblePerson(index, 'address', e.target.value)}
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Medications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Medications</h3>
                <Button type="button" variant="outline" size="sm" onClick={addMedication} className="bg-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medication
                </Button>
              </div>
              {medications.map((medication, index) => (
                <div key={index} className="space-y-4 rounded-lg border border-border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Medication {index + 1}</span>
                    {medications.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeMedication(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`medication-name-${index}`} className="text-foreground">
                        Name
                      </Label>
                      <Input
                        id={`medication-name-${index}`}
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`medication-dosage-${index}`} className="text-foreground">
                        Dosage
                      </Label>
                      <Input
                        id={`medication-dosage-${index}`}
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`medication-times-${index}`} className="text-foreground">
                        Administration Times (comma-separated)
                      </Label>
                      <Input
                        id={`medication-times-${index}`}
                        value={medication.administrationTimes}
                        onChange={(e) => updateMedication(index, 'administrationTimes', e.target.value)}
                        placeholder="8:00 AM, 2:00 PM, 8:00 PM"
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`medication-physician-${index}`} className="text-foreground">
                        Prescribing Physician Name
                      </Label>
                      <Input
                        id={`medication-physician-${index}`}
                        value={medication.prescribingPhysicianName}
                        onChange={(e) => updateMedication(index, 'prescribingPhysicianName', e.target.value)}
                        placeholder="Must match a physician name above"
                        className="bg-white border-input text-foreground"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addResident.isPending} className="bg-white">
                Cancel
              </Button>
              <Button type="submit" disabled={addResident.isPending} className="bg-primary text-primary-foreground">
                {addResident.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Resident'
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
