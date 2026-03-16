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
import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { Medication } from "../backend";
import { useAddMarRecord } from "../hooks/useQueries";
import type { Resident } from "../hooks/useQueries";

interface AddMarRecordDialogProps {
  resident: Resident;
  children?: React.ReactNode;
}

export default function AddMarRecordDialog({
  resident,
  children,
}: AddMarRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: addMarRecord, isPending } = useAddMarRecord();

  const [selectedMedicationId, setSelectedMedicationId] = useState("");
  const [administrationTime, setAdministrationTime] = useState("");
  const [administeredBy, setAdministeredBy] = useState("");
  const [notes, setNotes] = useState("");

  const activeMedications = resident.medications.filter(
    (m: Medication) => m.status === "active" || m.status === ("active" as any),
  );

  const resetForm = () => {
    setSelectedMedicationId("");
    setAdministrationTime("");
    setAdministeredBy("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedMedicationId ||
      !administrationTime ||
      !administeredBy.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const timestamp = new Date(administrationTime).getTime() * 1_000_000;

    addMarRecord(
      {
        residentId: resident.id,
        medicationId: Number(selectedMedicationId),
        administrationTime: timestamp,
        administeredBy: administeredBy.trim(),
        notes: notes.trim(),
      },
      {
        onSuccess: () => {
          toast.success("MAR record added successfully.");
          resetForm();
          setOpen(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to add MAR record.",
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            Add MAR Record
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Add Medication Administration Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Medication *</Label>
            <Select
              value={selectedMedicationId}
              onValueChange={setSelectedMedicationId}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select medication" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {activeMedications.map((m: Medication) => (
                  <SelectItem key={String(m.id)} value={String(m.id)}>
                    {m.name} — {m.dosage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Administration Time *</Label>
            <Input
              type="datetime-local"
              value={administrationTime}
              onChange={(e) => setAdministrationTime(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Administered By *</Label>
            <Input
              value={administeredBy}
              onChange={(e) => setAdministeredBy(e.target.value)}
              placeholder="Staff name"
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className="bg-white"
              rows={3}
            />
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
                  Adding...
                </>
              ) : (
                "Add Record"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
