import { useState } from 'react';
import { useAddWeightEntry } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { dateStringToNanoseconds } from '../lib/dateUtils';
import type { Resident } from '../backend';

interface AddWeightEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: Resident | null;
}

export default function AddWeightEntryDialog({ open, onOpenChange, resident }: AddWeightEntryDialogProps) {
  const [measurementDate, setMeasurementDate] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [notes, setNotes] = useState('');

  const addWeightEntry = useAddWeightEntry();

  const resetForm = () => {
    setMeasurementDate('');
    setWeight('');
    setWeightUnit('lbs');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resident || !measurementDate || !weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const measurementDateNanoseconds = dateStringToNanoseconds(measurementDate);
      const weightValue = parseFloat(weight);

      await addWeightEntry.mutateAsync({
        residentId: resident.id,
        weight: weightValue,
        weightUnit,
        measurementDate: measurementDateNanoseconds,
        notes,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding weight entry:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Weight Entry</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Record weight measurement for {resident?.firstName} {resident?.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="measurementDate" className="text-foreground">
              Measurement Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="measurementDate"
              type="date"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
              required
              className="bg-white border-input text-foreground"
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-foreground">
                Weight <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="150"
                required
                className="bg-white border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightUnit" className="text-foreground">
                Unit <span className="text-red-500">*</span>
              </Label>
              <Select value={weightUnit} onValueChange={(value) => setWeightUnit(value as 'lbs' | 'kg')}>
                <SelectTrigger id="weightUnit" className="bg-white border-input text-foreground">
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
            <Label htmlFor="notes" className="text-foreground">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional observations or notes"
              rows={3}
              className="bg-white border-input text-foreground"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addWeightEntry.isPending} className="bg-white">
              Cancel
            </Button>
            <Button type="submit" disabled={addWeightEntry.isPending} className="bg-primary text-primary-foreground">
              {addWeightEntry.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Weight'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
