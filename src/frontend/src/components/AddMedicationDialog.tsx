import { useState } from 'react';
import { useAddMedication } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Resident } from '../backend';
import { AdministrationRoute } from '../backend';

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: Resident | null;
}

export default function AddMedicationDialog({ open, onOpenChange, resident }: AddMedicationDialogProps) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [dosageQuantity, setDosageQuantity] = useState('');
  const [administrationRoute, setAdministrationRoute] = useState<AdministrationRoute>(AdministrationRoute.oral);
  const [administrationTimes, setAdministrationTimes] = useState('');
  const [prescribingPhysicianName, setPrescribingPhysicianName] = useState('');
  const [notes, setNotes] = useState('');

  const addMedication = useAddMedication();

  const resetForm = () => {
    setName('');
    setDosage('');
    setDosageQuantity('');
    setAdministrationRoute(AdministrationRoute.oral);
    setAdministrationTimes('');
    setPrescribingPhysicianName('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resident || !name || !dosage) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const prescribingPhysician = resident.physicians.find(
        (p) => p.name.toLowerCase() === prescribingPhysicianName.toLowerCase()
      );

      const timesArray = administrationTimes
        ? administrationTimes.split(',').map((t) => t.trim())
        : [];

      await addMedication.mutateAsync({
        residentId: resident.id,
        name,
        dosage,
        administrationTimes: timesArray,
        prescribingPhysician: prescribingPhysician || null,
        administrationRoute,
        dosageQuantity,
        notes,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Medication</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new medication for {resident?.firstName} {resident?.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Medication Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Lisinopril"
              required
              className="bg-white border-input text-foreground"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dosage" className="text-foreground">
                Dosage <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 10mg"
                required
                className="bg-white border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosageQuantity" className="text-foreground">
                Dosage Quantity
              </Label>
              <Input
                id="dosageQuantity"
                value={dosageQuantity}
                onChange={(e) => setDosageQuantity(e.target.value)}
                placeholder="e.g., 1 tablet"
                className="bg-white border-input text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="administrationRoute" className="text-foreground">
              Administration Route <span className="text-red-500">*</span>
            </Label>
            <Select value={administrationRoute} onValueChange={(value) => setAdministrationRoute(value as AdministrationRoute)}>
              <SelectTrigger id="administrationRoute" className="bg-white border-input text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value={AdministrationRoute.oral}>Oral</SelectItem>
                <SelectItem value={AdministrationRoute.injection}>Injection</SelectItem>
                <SelectItem value={AdministrationRoute.topical}>Topical</SelectItem>
                <SelectItem value={AdministrationRoute.inhaled}>Inhaled</SelectItem>
                <SelectItem value={AdministrationRoute.sublingual}>Sublingual</SelectItem>
                <SelectItem value={AdministrationRoute.rectal}>Rectal</SelectItem>
                <SelectItem value={AdministrationRoute.transdermal}>Transdermal</SelectItem>
                <SelectItem value={AdministrationRoute.intravenous}>Intravenous</SelectItem>
                <SelectItem value={AdministrationRoute.intramuscular}>Intramuscular</SelectItem>
                <SelectItem value={AdministrationRoute.subcutaneous}>Subcutaneous</SelectItem>
                <SelectItem value={AdministrationRoute.ophthalmic}>Ophthalmic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="administrationTimes" className="text-foreground">
              Administration Times
            </Label>
            <Input
              id="administrationTimes"
              value={administrationTimes}
              onChange={(e) => setAdministrationTimes(e.target.value)}
              placeholder="e.g., 8:00 AM, 2:00 PM, 8:00 PM"
              className="bg-white border-input text-foreground"
            />
            <p className="text-xs text-muted-foreground">Separate multiple times with commas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescribingPhysician" className="text-foreground">
              Prescribing Physician
            </Label>
            <Select value={prescribingPhysicianName} onValueChange={setPrescribingPhysicianName}>
              <SelectTrigger id="prescribingPhysician" className="bg-white border-input text-foreground">
                <SelectValue placeholder="Select a physician" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {resident?.physicians.map((physician) => (
                  <SelectItem key={physician.id.toString()} value={physician.name}>
                    {physician.name} - {physician.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or instructions"
              rows={3}
              className="bg-white border-input text-foreground"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addMedication.isPending} className="bg-white">
              Cancel
            </Button>
            <Button type="submit" disabled={addMedication.isPending} className="bg-primary text-primary-foreground">
              {addMedication.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Medication'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
