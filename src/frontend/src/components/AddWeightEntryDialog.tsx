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
import { useAddWeightEntry } from "../hooks/useQueries";
import type { Resident } from "../hooks/useQueries";

interface AddWeightEntryDialogProps {
  resident: Resident;
  children?: React.ReactNode;
}

export default function AddWeightEntryDialog({
  resident,
  children,
}: AddWeightEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: addWeightEntry, isPending } = useAddWeightEntry();

  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("lbs");
  const [measurementDate, setMeasurementDate] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setWeight("");
    setWeightUnit("lbs");
    setMeasurementDate("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !measurementDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const weightValue = Number.parseFloat(weight);
    // Convert date string to nanoseconds as number (local Resident type uses number)
    const timestamp = new Date(measurementDate).getTime() * 1_000_000;

    addWeightEntry(
      {
        residentId: resident.id,
        weight: weightValue,
        weightUnit,
        measurementDate: timestamp,
        notes: notes.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Weight entry recorded successfully.");
          resetForm();
          setOpen(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to record weight entry.",
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
            Add Weight Entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Record Weight Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Measurement Date *</Label>
            <Input
              type="date"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Weight *</Label>
              <Input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 150"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  Recording...
                </>
              ) : (
                "Record Weight"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
