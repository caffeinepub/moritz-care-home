import React, { useState } from 'react';
import { useAddMedication } from '../hooks/useQueries';
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

interface AddMedicationDialogProps {
  resident: Resident;
  children?: React.ReactNode;
}

const ROUTES = [
  { value: 'oral', label: 'Oral' },
  { value: 'injection', label: 'Injection' },
  { value: 'topical', label: 'Topical' },
  { value: 'inhaled', label: 'Inhaled' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'rectal', label: 'Rectal' },
  { value: 'transdermal', label: 'Transdermal' },
  { value: 'intravenous', label: 'Intravenous' },
  { value: 'intramuscular', label: 'Intramuscular' },
  { value: 'subcutaneous', label: 'Subcutaneous' },
  { value: 'ophthalmic', label: 'Ophthalmic' },
];

export default function AddMedicationDialog({ resident, children }: AddMedicationDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: addMedication, isPending } = useAddMedication();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [administrationTimes, setAdministrationTimes] = useState('');
  const [administrationRoute, setAdministrationRoute] = useState('oral');
  const [dosageQuantity, setDosageQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName(''); setDosage(''); setAdministrationTimes('');
    setAdministrationRoute('oral'); setDosageQuantity(''); setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    addMedication(
      {
        residentId: resident.id,
        name: name.trim(),
        dosage: dosage.trim(),
        administrationTimes: administrationTimes.split(',').map((t) => t.trim()).filter(Boolean),
        administrationRoute,
        dosageQuantity: dosageQuantity.trim(),
        notes: notes.trim(),
        status: 'active',
      },
      {
        onSuccess: () => {
          toast.success('Medication added successfully.');
          resetForm();
          setOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to add medication.');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? <Button variant="outline" size="sm">Add Medication</Button>}
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Add Medication</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Medication Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lisinopril" className="bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Dosage *</Label>
            <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 10mg" className="bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Administration Times</Label>
            <Input value={administrationTimes} onChange={(e) => setAdministrationTimes(e.target.value)} placeholder="e.g. 8:00 AM, 8:00 PM" className="bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Administration Route</Label>
            <Select value={administrationRoute} onValueChange={setAdministrationRoute}>
              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                {ROUTES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dosage Quantity</Label>
            <Input value={dosageQuantity} onChange={(e) => setDosageQuantity(e.target.value)} placeholder="e.g. 1 tablet" className="bg-white" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className="bg-white" rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : 'Add Medication'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
