import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdministrationRoute, MedicationStatus } from "../backend";
import type {
  Insurance,
  Medication,
  Pharmacy,
  Physician,
  ResponsiblePerson,
} from "../backend";
import { useIsCallerAdmin, useUpdateResident } from "../hooks/useQueries";
import type { Resident } from "../hooks/useQueries";
import { backendTimestampToDate } from "../lib/dateUtils";
import {
  mapRoomTypeFromBackend,
  mapRoomTypeToBackend,
} from "../lib/residentEnumMapping";

interface EditResidentDialogProps {
  resident: Resident;
  children?: React.ReactNode;
}

export default function EditResidentDialog({
  resident,
  children,
}: EditResidentDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: updateResident, isPending } = useUpdateResident();
  const { data: isAdmin } = useIsCallerAdmin();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("solo");
  const [bed, setBed] = useState("");
  const [medicaidNumber, setMedicaidNumber] = useState("");
  const [medicareNumber, setMedicareNumber] = useState("");

  const [physicians, setPhysicians] = useState<
    { id: number; name: string; specialty: string; contactNumber: string }[]
  >([]);
  const [responsiblePersons, setResponsiblePersons] = useState<
    {
      id: number;
      name: string;
      relationship: string;
      contactNumber: string;
      address: string;
    }[]
  >([]);
  const [medications, setMedications] = useState<
    {
      id: number;
      name: string;
      dosage: string;
      administrationTimes: string[];
      administrationRoute: string;
      dosageQuantity: string;
      notes: string;
      status: string;
    }[]
  >([]);

  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyAddress, setPharmacyAddress] = useState("");
  const [pharmacyContact, setPharmacyContact] = useState("");

  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insuranceAddress, setInsuranceAddress] = useState("");
  const [insuranceContact, setInsuranceContact] = useState("");

  useEffect(() => {
    if (open && resident) {
      setFirstName(resident.firstName);
      setLastName(resident.lastName);
      // backendTimestampToDate accepts bigint | number
      setDateOfBirth(backendTimestampToDate(resident.dateOfBirth));
      setAdmissionDate(backendTimestampToDate(resident.admissionDate));
      setRoomNumber(resident.roomNumber);
      setRoomType(mapRoomTypeFromBackend(resident.roomType as any));
      setBed(resident.bed ?? "");
      setMedicaidNumber(resident.medicaidNumber);
      setMedicareNumber(resident.medicareNumber);
      setPhysicians(
        resident.physicians.map((p) => ({ ...p, id: Number(p.id) })),
      );
      setResponsiblePersons(
        resident.responsiblePersons.map((rp) => ({ ...rp, id: Number(rp.id) })),
      );
      setMedications(
        resident.medications.map((m) => ({
          id: Number(m.id),
          name: m.name,
          dosage: m.dosage,
          administrationTimes: m.administrationTimes,
          administrationRoute: String(m.administrationRoute),
          dosageQuantity: m.dosageQuantity,
          notes: m.notes,
          status: String(m.status),
        })),
      );
      setPharmacyName(resident.pharmacy?.name ?? "");
      setPharmacyAddress(resident.pharmacy?.address ?? "");
      setPharmacyContact(resident.pharmacy?.contactNumber ?? "");
      setInsuranceCompany(resident.insurance?.companyName ?? "");
      setInsurancePolicyNumber(resident.insurance?.policyNumber ?? "");
      setInsuranceAddress(resident.insurance?.address ?? "");
      setInsuranceContact(resident.insurance?.contactNumber ?? "");
    }
  }, [open, resident]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !roomNumber.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const physiciansData: Physician[] = physicians
      .filter((p) => p.name.trim())
      .map((p, i) => ({
        id: BigInt(i + 1),
        name: p.name,
        specialty: p.specialty,
        contactNumber: p.contactNumber,
      }));

    const responsiblePersonsData: ResponsiblePerson[] = responsiblePersons
      .filter((rp) => rp.name.trim())
      .map((rp, i) => ({
        id: BigInt(i + 1),
        name: rp.name,
        relationship: rp.relationship,
        contactNumber: rp.contactNumber,
        address: rp.address,
      }));

    const medicationsData: Medication[] = medications
      .filter((m) => m.name.trim())
      .map((m, i) => ({
        id: BigInt(i + 1),
        name: m.name,
        dosage: m.dosage,
        administrationTimes: m.administrationTimes,
        administrationRoute: m.administrationRoute as AdministrationRoute,
        dosageQuantity: m.dosageQuantity,
        notes: m.notes,
        status: m.status as MedicationStatus,
        prescribingPhysician: physiciansData[0] ?? undefined,
      }));

    const pharmacyData: Pharmacy | null = pharmacyName.trim()
      ? {
          id: BigInt(1),
          name: pharmacyName,
          address: pharmacyAddress,
          contactNumber: pharmacyContact,
        }
      : null;

    const insuranceData: Insurance | null = insuranceCompany.trim()
      ? {
          id: BigInt(1),
          companyName: insuranceCompany,
          policyNumber: insurancePolicyNumber,
          address: insuranceAddress,
          contactNumber: insuranceContact,
        }
      : null;

    const updatedResident: Resident = {
      ...resident,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      roomNumber: roomNumber.trim(),
      roomType: mapRoomTypeToBackend(roomType) as any,
      bed: bed.trim() || undefined,
      medicaidNumber: medicaidNumber.trim(),
      medicareNumber: medicareNumber.trim(),
      physicians: physiciansData,
      responsiblePersons: responsiblePersonsData,
      medications: medicationsData,
      pharmacy: pharmacyData ?? undefined,
      insurance: insuranceData ?? undefined,
    };

    updateResident(
      { residentId: resident.id, updates: updatedResident },
      {
        onSuccess: () => {
          toast.success("Resident updated successfully.");
          setOpen(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to update resident.",
          );
        },
      },
    );
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? <Button variant="outline">Edit</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Edit Resident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Admission Date</Label>
              <Input
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Room Number *</Label>
              <Input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="sharedRoom">Shared Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bed</Label>
              <Input
                value={bed}
                onChange={(e) => setBed(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Medicaid Number</Label>
              <Input
                value={medicaidNumber}
                onChange={(e) => setMedicaidNumber(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Medicare Number</Label>
              <Input
                value={medicareNumber}
                onChange={(e) => setMedicareNumber(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          {/* Physicians */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Physicians</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPhysicians([
                    ...physicians,
                    {
                      id: Date.now(),
                      name: "",
                      specialty: "",
                      contactNumber: "",
                    },
                  ])
                }
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {physicians.map((p, i) => (
              <div
                key={p.id}
                className="grid grid-cols-3 gap-2 p-3 border rounded-lg bg-white"
              >
                <Input
                  placeholder="Name"
                  value={p.name}
                  onChange={(e) =>
                    setPhysicians(
                      physicians.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  className="bg-white"
                />
                <Input
                  placeholder="Specialty"
                  value={p.specialty}
                  onChange={(e) =>
                    setPhysicians(
                      physicians.map((x, j) =>
                        j === i ? { ...x, specialty: e.target.value } : x,
                      ),
                    )
                  }
                  className="bg-white"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Contact"
                    value={p.contactNumber}
                    onChange={(e) =>
                      setPhysicians(
                        physicians.map((x, j) =>
                          j === i ? { ...x, contactNumber: e.target.value } : x,
                        ),
                      )
                    }
                    className="bg-white"
                  />
                  {physicians.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setPhysicians(physicians.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Responsible Persons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Responsible Persons
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setResponsiblePersons([
                    ...responsiblePersons,
                    {
                      id: Date.now(),
                      name: "",
                      relationship: "",
                      contactNumber: "",
                      address: "",
                    },
                  ])
                }
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {responsiblePersons.map((rp, i) => (
              <div
                key={rp.id}
                className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-white"
              >
                <Input
                  placeholder="Name"
                  value={rp.name}
                  onChange={(e) =>
                    setResponsiblePersons(
                      responsiblePersons.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  className="bg-white"
                />
                <Input
                  placeholder="Relationship"
                  value={rp.relationship}
                  onChange={(e) =>
                    setResponsiblePersons(
                      responsiblePersons.map((x, j) =>
                        j === i ? { ...x, relationship: e.target.value } : x,
                      ),
                    )
                  }
                  className="bg-white"
                />
                <Input
                  placeholder="Contact Number"
                  value={rp.contactNumber}
                  onChange={(e) =>
                    setResponsiblePersons(
                      responsiblePersons.map((x, j) =>
                        j === i ? { ...x, contactNumber: e.target.value } : x,
                      ),
                    )
                  }
                  className="bg-white"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Address"
                    value={rp.address}
                    onChange={(e) =>
                      setResponsiblePersons(
                        responsiblePersons.map((x, j) =>
                          j === i ? { ...x, address: e.target.value } : x,
                        ),
                      )
                    }
                    className="bg-white"
                  />
                  {responsiblePersons.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setResponsiblePersons(
                          responsiblePersons.filter((_, j) => j !== i),
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Medications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Medications</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setMedications([
                    ...medications,
                    {
                      id: Date.now(),
                      name: "",
                      dosage: "",
                      administrationTimes: [],
                      administrationRoute: "oral",
                      dosageQuantity: "",
                      notes: "",
                      status: "active",
                    },
                  ])
                }
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {medications.map((m, i) => (
              <div
                key={m.id}
                className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-white"
              >
                <Input
                  placeholder="Medication Name"
                  value={m.name}
                  onChange={(e) =>
                    setMedications(
                      medications.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  className="bg-white"
                />
                <Input
                  placeholder="Dosage"
                  value={m.dosage}
                  onChange={(e) =>
                    setMedications(
                      medications.map((x, j) =>
                        j === i ? { ...x, dosage: e.target.value } : x,
                      ),
                    )
                  }
                  className="bg-white"
                />
                <Input
                  placeholder="Admin Times (comma-separated)"
                  value={m.administrationTimes.join(", ")}
                  onChange={(e) =>
                    setMedications(
                      medications.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              administrationTimes: e.target.value
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean),
                            }
                          : x,
                      ),
                    )
                  }
                  className="bg-white"
                />
                <Input
                  placeholder="Dosage Quantity"
                  value={m.dosageQuantity}
                  onChange={(e) =>
                    setMedications(
                      medications.map((x, j) =>
                        j === i ? { ...x, dosageQuantity: e.target.value } : x,
                      ),
                    )
                  }
                  className="bg-white"
                />
                <div className="col-span-2 flex gap-2">
                  <Textarea
                    placeholder="Notes"
                    value={m.notes}
                    onChange={(e) =>
                      setMedications(
                        medications.map((x, j) =>
                          j === i ? { ...x, notes: e.target.value } : x,
                        ),
                      )
                    }
                    className="bg-white"
                    rows={2}
                  />
                  {medications.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setMedications(medications.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pharmacy */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Pharmacy (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-white">
              <Input
                placeholder="Pharmacy Name"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="bg-white"
              />
              <Input
                placeholder="Contact Number"
                value={pharmacyContact}
                onChange={(e) => setPharmacyContact(e.target.value)}
                className="bg-white"
              />
              <Input
                placeholder="Address"
                value={pharmacyAddress}
                onChange={(e) => setPharmacyAddress(e.target.value)}
                className="col-span-2 bg-white"
              />
            </div>
          </div>

          {/* Insurance */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Insurance (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-white">
              <Input
                placeholder="Company Name"
                value={insuranceCompany}
                onChange={(e) => setInsuranceCompany(e.target.value)}
                className="bg-white"
              />
              <Input
                placeholder="Policy Number"
                value={insurancePolicyNumber}
                onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                className="bg-white"
              />
              <Input
                placeholder="Contact Number"
                value={insuranceContact}
                onChange={(e) => setInsuranceContact(e.target.value)}
                className="bg-white"
              />
              <Input
                placeholder="Address"
                value={insuranceAddress}
                onChange={(e) => setInsuranceAddress(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
