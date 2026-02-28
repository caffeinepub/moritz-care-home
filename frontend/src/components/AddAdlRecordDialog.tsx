import React, { useState } from 'react';
import { useAddAdlRecord } from '../hooks/useQueries';
import type { Resident } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddAdlRecordDialogProps {
  resident: Resident;
  children?: React.ReactNode;
}

const ACTIVITY_TYPES = [
  'Bathing', 'Dressing', 'Grooming', 'Oral Care', 'Toileting',
  'Transferring', 'Ambulation', 'Eating', 'Meal Setup', 'Other',
];

const ASSISTANCE_LEVELS = [
  'Independent', 'Supervision', 'Limited Assistance',
  'Extensive Assistance', 'Total Dependence', 'Activity Did Not Occur',
];

export default function AddAdlRecordDialog({ resident, children }: AddAdlRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: addAdlRecord, isPending } = useAddAdlRecord();

  const [date, setDate] = useState('');
  const [activity, setActivity] = useState('');
  const [assistanceLevel, setAssistanceLevel] = useState('');
  const [staffNotes, setStaffNotes] = useState('');

  const resetForm = () => {
    setDate('');
    setActivity('');
    setAssistanceLevel('');
    setStaffNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !activity || !assistanceLevel) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const timestamp = new Date(date).getTime() * 1_000_000;

    addAdlRecord(
      {
        residentId: resident.id,
        date: timestamp,
        activity,
        assistanceLevel,
        staffNotes: staffNotes.trim(),
      },
      {
        onSuccess: () => {
          toast.success('ADL record added successfully.');
          resetForm();
          setOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to add ADL record.');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? <Button variant="outline" size="sm">Add ADL Record</Button>}
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Add ADL Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Activity *</Label>
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select activity" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {ACTIVITY_TYPES.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assistance Level *</Label>
            <Select value={assistanceLevel} onValueChange={setAssistanceLevel}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select assistance level" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {ASSISTANCE_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Staff Notes</Label>
            <Textarea
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="Optional notes"
              className="bg-white"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : 'Add Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
