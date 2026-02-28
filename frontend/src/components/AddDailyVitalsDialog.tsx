import React, { useState } from 'react';
import { useAddDailyVitals } from '../hooks/useQueries';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddDailyVitalsDialogProps {
  resident: Resident;
  children?: React.ReactNode;
}

export default function AddDailyVitalsDialog({ resident, children }: AddDailyVitalsDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: addDailyVitals, isPending } = useAddDailyVitals();

  const [measurementDateTime, setMeasurementDateTime] = useState('');
  const [temperatureF, setTemperatureF] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [pulseRate, setPulseRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [bloodGlucose, setBloodGlucose] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setMeasurementDateTime(''); setTemperatureF(''); setBpSystolic('');
    setBpDiastolic(''); setPulseRate(''); setRespiratoryRate('');
    setOxygenSaturation(''); setBloodGlucose(''); setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!measurementDateTime || !temperatureF || !bpSystolic || !bpDiastolic || !pulseRate || !respiratoryRate || !oxygenSaturation) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const tempF = parseFloat(temperatureF);
    const tempC = (tempF - 32) * 5 / 9;
    const timestamp = new Date(measurementDateTime).getTime() * 1_000_000;

    addDailyVitals(
      {
        residentId: resident.id,
        temperature: tempC,
        bloodPressureSystolic: parseInt(bpSystolic),
        bloodPressureDiastolic: parseInt(bpDiastolic),
        pulseRate: parseInt(pulseRate),
        respiratoryRate: parseInt(respiratoryRate),
        oxygenSaturation: parseInt(oxygenSaturation),
        bloodGlucose: bloodGlucose ? parseInt(bloodGlucose) : undefined,
        measurementDateTime: timestamp,
        notes: notes.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Vitals recorded successfully.');
          resetForm();
          setOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to record vitals.');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? <Button variant="outline" size="sm">Add Vitals</Button>}
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Record Daily Vitals</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Date & Time *</Label>
            <Input type="datetime-local" value={measurementDateTime} onChange={(e) => setMeasurementDateTime(e.target.value)} className="bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Temperature (°F) *</Label>
              <Input type="number" step="0.1" value={temperatureF} onChange={(e) => setTemperatureF(e.target.value)} placeholder="98.6" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Pulse Rate (bpm) *</Label>
              <Input type="number" value={pulseRate} onChange={(e) => setPulseRate(e.target.value)} placeholder="72" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>BP Systolic (mmHg) *</Label>
              <Input type="number" value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} placeholder="120" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>BP Diastolic (mmHg) *</Label>
              <Input type="number" value={bpDiastolic} onChange={(e) => setBpDiastolic(e.target.value)} placeholder="80" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Respiratory Rate *</Label>
              <Input type="number" value={respiratoryRate} onChange={(e) => setRespiratoryRate(e.target.value)} placeholder="16" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>O₂ Saturation (%) *</Label>
              <Input type="number" value={oxygenSaturation} onChange={(e) => setOxygenSaturation(e.target.value)} placeholder="98" className="bg-white" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Blood Glucose (mg/dL)</Label>
              <Input type="number" value={bloodGlucose} onChange={(e) => setBloodGlucose(e.target.value)} placeholder="Optional" className="bg-white" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className="bg-white" rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recording...</> : 'Record Vitals'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
