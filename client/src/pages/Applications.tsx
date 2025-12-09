import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Search, Filter, Calendar, DollarSign, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Applications() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New application form state
  const [projectTitle, setProjectTitle] = useState('');
  const [grantOpportunityId, setGrantOpportunityId] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [coFinancingAmount, setCoFinancingAmount] = useState('');
  const [targetBeneficiaries, setTargetBeneficiaries] = useState('');

  const { data: applications, isLoading, refetch } = trpc.applications.list.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const { data: grantOpportunities } = trpc.grantOpportunities.list.useQuery({});

  const createMutation = trpc.applications.create.useMutation({
    onSuccess: () => {
      toast.success('Application created successfully');
      setIsDialogOpen(false);
      refetch();
      // Reset form
      setProjectTitle('');
      setGrantOpportunityId('');
      setRequestedAmount('');
      setCoFinancingAmount('');
      setTargetBeneficiaries('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create application');
    },
  });

  const handleCreateApplication = () => {
    if (!projectTitle || !grantOpportunityId) {
      toast.error('Please fill in required fields');
      return;
    }

    createMutation.mutate({
      grantOpportunityId: parseInt(grantOpportunityId),
      projectTitle,
      requestedAmount: requestedAmount ? parseFloat(requestedAmount) : undefined,
      coFinancingAmount: coFinancingAmount ? parseFloat(coFinancingAmount) : undefined,
      targetBeneficiaries: targetBeneficiaries || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grant Applications</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your grant application submissions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Application</DialogTitle>
              <DialogDescription>
                Start a new grant application by providing the basic information below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="grantOpportunity">Grant Opportunity *</Label>
                <Select value={grantOpportunityId} onValueChange={setGrantOpportunityId}>
                  <SelectTrigger id="grantOpportunity">
                    <SelectValue placeholder="Select a grant opportunity" />
                  </SelectTrigger>
                  <SelectContent>
                    {grantOpportunities?.map((opp) => (
                      <SelectItem key={opp.id} value={opp.id.toString()}>
                        {opp.programTitle} - {opp.fundingSource}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectTitle">Project Title *</Label>
                <Input
                  id="projectTitle"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Enter your project title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requestedAmount">Requested Amount</Label>
                  <Input
                    id="requestedAmount"
                    type="number"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coFinancingAmount">Co-financing Amount</Label>
                  <Input
                    id="coFinancingAmount"
                    type="number"
                    value={coFinancingAmount}
                    onChange={(e) => setCoFinancingAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetBeneficiaries">Target Beneficiaries</Label>
                <Textarea
                  id="targetBeneficiaries"
                  value={targetBeneficiaries}
                  onChange={(e) => setTargetBeneficiaries(e.target.value)}
                  placeholder="Describe your target beneficiaries"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateApplication} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{app.projectTitle}</CardTitle>
                      <Badge className={getStatusColor(app.status)}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription>
                      {app.requestedAmount && `Requested: $${app.requestedAmount.toLocaleString()}`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {app.submittedAt && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Submitted {new Date(app.submittedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by creating your first grant application
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
