import { useState } from 'react';
import { useAddAdlRecord } from '../hooks/useQueries';
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

interface AddAdlRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: Resident | null;
}

const ACTIVITIES = [
  'Bathing',
  'Dressing',
  'Toileting',
  'Transferring',
  'Continence',
  'Feeding',
  'Grooming',
  'Walking',
  'Medication Management',
];

const ASSISTANCE_LEVELS = [
  'Independent',
  'Supervision',
  'Minimal Assistance',
  'Moderate Assistance',
  'Maximum Assistance',
  'Total Dependence',
];

export default function AddAdlRecordDialog({ open, onOpenChange, resident }: AddAdlRecordDialogProps) {
  const [date, setDate] = useState('');
  const [activity, setActivity] = useState('');
  const [assistanceLevel, setAssistanceLevel] = useState('');
  const [staffNotes, setStaffNotes] = useState('');

  const addAdlRecord = useAddAdlRecord();

  const resetForm = () => {
    setDate('');
    setActivity('');
    setAssistanceLevel('');
    setStaffNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resident || !date || !activity || !assistanceLevel) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const dateNanoseconds = dateStringToNanoseconds(date);

      await addAdlRecord.mutateAsync({
        residentId: resident.id,
        date: dateNanoseconds,
        activity,
        assistanceLevel,
        staffNotes,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding ADL record:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add ADL Record</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Record activities of daily living for {resident?.firstName} {resident?.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-foreground">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-white border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity" className="text-foreground">
              Activity <span className="text-red-500">*</span>
            </Label>
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger id="activity" className="bg-white border-input text-foreground">
                <SelectValue placeholder="Select an activity" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {ACTIVITIES.map((act) => (
                  <SelectItem key={act} value={act}>
                    {act}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assistanceLevel" className="text-foreground">
              Assistance Level <span className="text-red-500">*</span>
            </Label>
            <Select value={assistanceLevel} onValueChange={setAssistanceLevel}>
              <SelectTrigger id="assistanceLevel" className="bg-white border-input text-foreground">
                <SelectValue placeholder="Select assistance level" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {ASSISTANCE_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staffNotes" className="text-foreground">
              Staff Notes
            </Label>
            <Textarea
              id="staffNotes"
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="Additional observations or notes"
              rows={4}
              className="bg-white border-input text-foreground"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addAdlRecord.isPending} className="bg-white">
              Cancel
            </Button>
            <Button type="submit" disabled={addAdlRecord.isPending} className="bg-primary text-primary-foreground">
              {addAdlRecord.isPending ? (
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
