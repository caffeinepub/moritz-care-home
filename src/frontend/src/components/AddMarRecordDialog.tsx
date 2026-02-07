import { useState } from 'react';
import { useAddMarRecord } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { dateStringToNanoseconds } from '../lib/dateUtils';
import type { Resident, Medication } from '../backend';
import { MedicationStatus } from '../backend';

interface AddMarRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: Resident | null;
}

export default function AddMarRecordDialog({ open, onOpenChange, resident }: AddMarRecordDialogProps) {
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>('');
  const [administrationDate, setAdministrationDate] = useState('');
  const [administrationTime, setAdministrationTime] = useState('');
  const [administeredBy, setAdministeredBy] = useState('');
  const [notes, setNotes] = useState('');

  const addMarRecord = useAddMarRecord();

  const resetForm = () => {
    setSelectedMedicationId('');
    setAdministrationDate('');
    setAdministrationTime('');
    setAdministeredBy('');
    setNotes('');
  };

  const activeMedications = resident?.medications.filter((m) => m.status === MedicationStatus.active) || [];
  const selectedMedication = activeMedications.find((m) => m.id.toString() === selectedMedicationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resident || !selectedMedicationId || !administrationDate || !administrationTime || !administeredBy) {
      toast.error('Please fill in all required fields');
      return;
    }

    const medication = activeMedications.find((m) => m.id.toString() === selectedMedicationId);
    if (!medication) {
      toast.error('Selected medication not found');
      return;
    }

    try {
      const dateTimeString = `${administrationDate}T${administrationTime}`;
      const administrationTimeNanoseconds = dateStringToNanoseconds(dateTimeString);

      await addMarRecord.mutateAsync({
        residentId: resident.id,
        medication,
        administrationTime: administrationTimeNanoseconds,
        administeredBy,
        notes,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding MAR record:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Medication Administration Record</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Record medication administration for {resident?.firstName} {resident?.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medication" className="text-foreground">
              Medication <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedMedicationId} onValueChange={setSelectedMedicationId}>
              <SelectTrigger id="medication" className="bg-white border-input text-foreground">
                <SelectValue placeholder="Select a medication" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {activeMedications.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No active medications</div>
                ) : (
                  activeMedications.map((medication) => (
                    <SelectItem key={medication.id.toString()} value={medication.id.toString()}>
                      {medication.name} - {medication.dosage}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedMedication && (
            <Card className="bg-white border-border">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Medication:</span>
                    <span className="text-foreground">{selectedMedication.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Dosage:</span>
                    <span className="text-foreground">{selectedMedication.dosage}</span>
                  </div>
                  {selectedMedication.dosageQuantity && (
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Quantity:</span>
                      <span className="text-foreground">{selectedMedication.dosageQuantity}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Route:</span>
                    <span className="text-foreground capitalize">{selectedMedication.administrationRoute}</span>
                  </div>
                  {selectedMedication.administrationTimes.length > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Scheduled Times:</span>
                      <span className="text-foreground">{selectedMedication.administrationTimes.join(', ')}</span>
                    </div>
                  )}
                  {selectedMedication.prescribingPhysician && (
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Prescribing Physician:</span>
                      <span className="text-foreground">{selectedMedication.prescribingPhysician.name}</span>
                    </div>
                  )}
                  {selectedMedication.notes && (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">Notes:</span>
                      <span className="text-muted-foreground">{selectedMedication.notes}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="administrationDate" className="text-foreground">
                Administration Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="administrationDate"
                type="date"
                value={administrationDate}
                onChange={(e) => setAdministrationDate(e.target.value)}
                required
                className="bg-white border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="administrationTime" className="text-foreground">
                Administration Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="administrationTime"
                type="time"
                value={administrationTime}
                onChange={(e) => setAdministrationTime(e.target.value)}
                required
                className="bg-white border-input text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="administeredBy" className="text-foreground">
              Administered By <span className="text-red-500">*</span>
            </Label>
            <Input
              id="administeredBy"
              value={administeredBy}
              onChange={(e) => setAdministeredBy(e.target.value)}
              placeholder="Staff member name"
              required
              className="bg-white border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations or notes"
              rows={3}
              className="bg-white border-input text-foreground"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addMarRecord.isPending} className="bg-white">
              Cancel
            </Button>
            <Button type="submit" disabled={addMarRecord.isPending || activeMedications.length === 0} className="bg-primary text-primary-foreground">
              {addMarRecord.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Record'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
