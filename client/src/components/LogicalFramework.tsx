import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Save, Trash2, FileText, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface LFARow {
  id: string;
  narrative: string;
  indicators: string;
  meansOfVerification: string;
  assumptions: string;
}

export default function LogicalFramework({ applicationId }: { applicationId: number }) {
  const { t } = useTranslation();
  const [goal, setGoal] = useState<LFARow>({ id: 'goal', narrative: '', indicators: '', meansOfVerification: '', assumptions: '' });
  const [purpose, setPurpose] = useState<LFARow>({ id: 'purpose', narrative: '', indicators: '', meansOfVerification: '', assumptions: '' });
  const [outputs, setOutputs] = useState<LFARow[]>([{ id: '1', narrative: '', indicators: '', meansOfVerification: '', assumptions: '' }]);
  const [activities, setActivities] = useState<LFARow[]>([{ id: '1', narrative: '', indicators: '', meansOfVerification: '', assumptions: '' }]);

  const saveMutation = trpc.lfa.save.useMutation({
    onSuccess: () => {
      toast.success('Logical Framework saved successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      applicationId,
      goal,
      purpose,
      outputs,
      activities,
    });
  };

  const addOutput = () => {
    setOutputs([...outputs, { id: Date.now().toString(), narrative: '', indicators: '', meansOfVerification: '', assumptions: '' }]);
  };

  const addActivity = () => {
    setActivities([...activities, { id: Date.now().toString(), narrative: '', indicators: '', meansOfVerification: '', assumptions: '' }]);
  };

  const removeOutput = (id: string) => {
    setOutputs(outputs.filter(o => o.id !== id));
  };

  const removeActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Logical Framework (LFA)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define your project's logic model with clear objectives, indicators, and assumptions
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          Save Framework
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Overall Goal
          </CardTitle>
          <CardDescription>The broader development objective to which the project contributes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Narrative Summary</Label>
              <Textarea
                value={goal.narrative}
                onChange={(e) => setGoal({ ...goal, narrative: e.target.value })}
                placeholder="What is the overall goal?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Objectively Verifiable Indicators</Label>
              <Textarea
                value={goal.indicators}
                onChange={(e) => setGoal({ ...goal, indicators: e.target.value })}
                placeholder="How will success be measured?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Means of Verification</Label>
              <Textarea
                value={goal.meansOfVerification}
                onChange={(e) => setGoal({ ...goal, meansOfVerification: e.target.value })}
                placeholder="Where can data be found?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Assumptions</Label>
              <Textarea
                value={goal.assumptions}
                onChange={(e) => setGoal({ ...goal, assumptions: e.target.value })}
                placeholder="What external factors are assumed?"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Purpose</CardTitle>
          <CardDescription>The specific objective the project aims to achieve</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Narrative Summary</Label>
              <Textarea
                value={purpose.narrative}
                onChange={(e) => setPurpose({ ...purpose, narrative: e.target.value })}
                placeholder="What is the project purpose?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Objectively Verifiable Indicators</Label>
              <Textarea
                value={purpose.indicators}
                onChange={(e) => setPurpose({ ...purpose, indicators: e.target.value })}
                placeholder="How will success be measured?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Means of Verification</Label>
              <Textarea
                value={purpose.meansOfVerification}
                onChange={(e) => setPurpose({ ...purpose, meansOfVerification: e.target.value })}
                placeholder="Where can data be found?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Assumptions</Label>
              <Textarea
                value={purpose.assumptions}
                onChange={(e) => setPurpose({ ...purpose, assumptions: e.target.value })}
                placeholder="What external factors are assumed?"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Outputs</CardTitle>
              <CardDescription>The tangible results delivered by the project</CardDescription>
            </div>
            <Button onClick={addOutput} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Output
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {outputs.map((output, index) => (
            <div key={output.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Output {index + 1}</h4>
                {outputs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOutput(output.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Narrative</Label>
                  <Textarea
                    value={output.narrative}
                    onChange={(e) => {
                      const updated = [...outputs];
                      updated[index] = { ...output, narrative: e.target.value };
                      setOutputs(updated);
                    }}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Indicators</Label>
                  <Textarea
                    value={output.indicators}
                    onChange={(e) => {
                      const updated = [...outputs];
                      updated[index] = { ...output, indicators: e.target.value };
                      setOutputs(updated);
                    }}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Verification</Label>
                  <Textarea
                    value={output.meansOfVerification}
                    onChange={(e) => {
                      const updated = [...outputs];
                      updated[index] = { ...output, meansOfVerification: e.target.value };
                      setOutputs(updated);
                    }}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assumptions</Label>
                  <Textarea
                    value={output.assumptions}
                    onChange={(e) => {
                      const updated = [...outputs];
                      updated[index] = { ...output, assumptions: e.target.value };
                      setOutputs(updated);
                    }}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activities</CardTitle>
              <CardDescription>The actions undertaken to produce the outputs</CardDescription>
            </div>
            <Button onClick={addActivity} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Activity {index + 1}</h4>
                {activities.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeActivity(activity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Narrative</Label>
                  <Textarea
                    value={activity.narrative}
                    onChange={(e) => {
                      const updated = [...activities];
                      updated[index] = { ...activity, narrative: e.target.value };
                      setActivities(updated);
                    }}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inputs/Resources</Label>
                  <Textarea
                    value={activity.indicators}
                    onChange={(e) => {
                      const updated = [...activities];
                      updated[index] = { ...activity, indicators: e.target.value };
                      setActivities(updated);
                    }}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Textarea
                    value={activity.meansOfVerification}
                    onChange={(e) => {
                      const updated = [...activities];
                      updated[index] = { ...activity, meansOfVerification: e.target.value };
                      setActivities(updated);
                    }}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assumptions</Label>
                  <Textarea
                    value={activity.assumptions}
                    onChange={(e) => {
                      const updated = [...activities];
                      updated[index] = { ...activity, assumptions: e.target.value };
                      setActivities(updated);
                    }}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
