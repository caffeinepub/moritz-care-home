import { useState } from 'react';
import { useAddDailyVitals } from '../hooks/useQueries';
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

interface AddDailyVitalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: Resident | null;
}

export default function AddDailyVitalsDialog({ open, onOpenChange, resident }: AddDailyVitalsDialogProps) {
  const [measurementDate, setMeasurementDate] = useState('');
  const [measurementTime, setMeasurementTime] = useState('');
  const [temperature, setTemperature] = useState('');
  const [temperatureUnit, setTemperatureUnit] = useState<'F' | 'C'>('F');
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState('');
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState('');
  const [pulseRate, setPulseRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [bloodGlucose, setBloodGlucose] = useState('');
  const [notes, setNotes] = useState('');

  const addDailyVitals = useAddDailyVitals();

  const resetForm = () => {
    setMeasurementDate('');
    setMeasurementTime('');
    setTemperature('');
    setTemperatureUnit('F');
    setBloodPressureSystolic('');
    setBloodPressureDiastolic('');
    setPulseRate('');
    setRespiratoryRate('');
    setOxygenSaturation('');
    setBloodGlucose('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !resident ||
      !measurementDate ||
      !measurementTime ||
      !temperature ||
      !bloodPressureSystolic ||
      !bloodPressureDiastolic ||
      !pulseRate ||
      !respiratoryRate ||
      !oxygenSaturation
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const dateTimeString = `${measurementDate}T${measurementTime}`;
      const measurementDateTimeNanoseconds = dateStringToNanoseconds(dateTimeString);

      let tempInFahrenheit = parseFloat(temperature);
      if (temperatureUnit === 'C') {
        tempInFahrenheit = (tempInFahrenheit * 9) / 5 + 32;
      }

      await addDailyVitals.mutateAsync({
        residentId: resident.id,
        temperature: tempInFahrenheit,
        bloodPressureSystolic: BigInt(bloodPressureSystolic),
        bloodPressureDiastolic: BigInt(bloodPressureDiastolic),
        pulseRate: BigInt(pulseRate),
        respiratoryRate: BigInt(respiratoryRate),
        oxygenSaturation: BigInt(oxygenSaturation),
        bloodGlucose: bloodGlucose ? BigInt(bloodGlucose) : null,
        measurementDateTime: measurementDateTimeNanoseconds,
        notes,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding daily vitals:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Daily Vitals</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Record vital signs for {resident?.firstName} {resident?.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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

            <div className="space-y-2">
              <Label htmlFor="measurementTime" className="text-foreground">
                Measurement Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="measurementTime"
                type="time"
                value={measurementTime}
                onChange={(e) => setMeasurementTime(e.target.value)}
                required
                className="bg-white border-input text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="temperature" className="text-foreground">
                Temperature <span className="text-red-500">*</span>
              </Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="98.6"
                required
                className="bg-white border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperatureUnit" className="text-foreground">
                Unit <span className="text-red-500">*</span>
              </Label>
              <Select value={temperatureUnit} onValueChange={(value) => setTemperatureUnit(value as 'F' | 'C')}>
                <SelectTrigger id="temperatureUnit" className="bg-white border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="F">°F</SelectItem>
                  <SelectItem value="C">°C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bloodPressureSystolic" className="text-foreground">
                Blood Pressure (Systolic) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bloodPressureSystolic"
                type="number"
                value={bloodPressureSystolic}
                onChange={(e) => setBloodPressureSystolic(e.target.value)}
                placeholder="120"
                required
                className="bg-white border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodPressureDiastolic" className="text-foreground">
                Blood Pressure (Diastolic) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bloodPressureDiastolic"
                type="number"
                value={bloodPressureDiastolic}
                onChange={(e) => setBloodPressureDiastolic(e.target.value)}
                placeholder="80"
                required
                className="bg-white border-input text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pulseRate" className="text-foreground">
                Pulse Rate (bpm) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pulseRate"
                type="number"
                value={pulseRate}
                onChange={(e) => setPulseRate(e.target.value)}
                placeholder="72"
                required
                className="bg-white border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="respiratoryRate" className="text-foreground">
                Respiratory Rate (breaths/min) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="respiratoryRate"
                type="number"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                placeholder="16"
                required
                className="bg-white border-input text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="oxygenSaturation" className="text-foreground">
                Oxygen Saturation (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="oxygenSaturation"
                type="number"
                value={oxygenSaturation}
                onChange={(e) => setOxygenSaturation(e.target.value)}
                placeholder="98"
                min="0"
                max="100"
                required
                className="bg-white border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodGlucose" className="text-foreground">
                Blood Glucose (mg/dL)
              </Label>
              <Input
                id="bloodGlucose"
                type="number"
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(e.target.value)}
                placeholder="100"
                className="bg-white border-input text-foreground"
              />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addDailyVitals.isPending} className="bg-white">
              Cancel
            </Button>
            <Button type="submit" disabled={addDailyVitals.isPending} className="bg-primary text-primary-foreground">
              {addDailyVitals.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Vitals'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
