import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Calendar, DollarSign, Edit, Trash2, ExternalLink, Loader2, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { format } from 'date-fns';

type GrantFormData = {
  id?: number;
  fundingSource: string;
  programTitle: string;
  applicationStartDate?: string;
  applicationDeadline: string;
  minAmount?: string;
  maxAmount?: string;
  callDocumentationUrl?: string;
  thematicArea?: string;
  geographicScope?: string;
  eligibilityCriteria?: string;
  notes?: string;
};

export default function GrantOpportunities() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingGrant, setEditingGrant] = useState<GrantFormData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [grantToDelete, setGrantToDelete] = useState<number | null>(null);
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{ total: number; success: number; failed: number; errors: { row: number; error: string }[] } | null>(null);

  const utils = trpc.useUtils();
  const { data: opportunities, isLoading } = trpc.grantOpportunities.list.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const createMutation = trpc.grantOpportunities.create.useMutation({
    onSuccess: () => {
      toast.success('Grant opportunity created successfully');
      setIsCreateDialogOpen(false);
      utils.grantOpportunities.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create grant opportunity');
    },
  });

  const updateMutation = trpc.grantOpportunities.updateFull.useMutation({
    onSuccess: () => {
      toast.success('Grant opportunity updated successfully');
      setIsEditDialogOpen(false);
      setEditingGrant(null);
      utils.grantOpportunities.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update grant opportunity');
    },
  });

  const deleteMutation = trpc.grantOpportunities.delete.useMutation({
    onSuccess: () => {
      toast.success('Grant opportunity deleted successfully');
      setDeleteDialogOpen(false);
      setGrantToDelete(null);
      utils.grantOpportunities.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete grant opportunity');
    },
  });

  const bulkImportMutation = trpc.grantOpportunities.bulkImport.useMutation({
    onSuccess: (results) => {
      setImportResults(results);
      if (results.failed === 0) {
        toast.success(`Successfully imported ${results.success} grants`);
      } else {
        toast.warning(`Imported ${results.success} grants, ${results.failed} failed`);
      }
      utils.grantOpportunities.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import grants');
    },
  });

  const downloadTemplate = () => {
    const template = [
      {
        fundingSource: 'European Commission',
        programTitle: 'Erasmus+ Youth in Action 2025',
        applicationStartDate: '2025-01-15',
        applicationDeadline: '2025-06-30',
        minAmount: 50000,
        maxAmount: 250000,
        callDocumentationUrl: 'https://erasmus-plus.ec.europa.eu/',
        thematicArea: 'Youth, Education, Social Inclusion',
        geographicScope: 'European Union',
        eligibilityCriteria: 'NGOs working with youth',
        notes: 'Example grant opportunity',
      },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grants_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const grants = results.data.map((row: any) => ({
          fundingSource: row.fundingSource || '',
          programTitle: row.programTitle || '',
          applicationStartDate: row.applicationStartDate || undefined,
          applicationDeadline: row.applicationDeadline || '',
          minAmount: row.minAmount ? parseInt(row.minAmount) : undefined,
          maxAmount: row.maxAmount ? parseInt(row.maxAmount) : undefined,
          callDocumentationUrl: row.callDocumentationUrl || undefined,
          thematicArea: row.thematicArea || undefined,
          geographicScope: row.geographicScope || undefined,
          eligibilityCriteria: row.eligibilityCriteria || undefined,
          notes: row.notes || undefined,
        }));

        bulkImportMutation.mutate({ grants });
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
      },
    });
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const startDate = formData.get('applicationStartDate') as string;
    const endDate = formData.get('applicationDeadline') as string;
    
    createMutation.mutate({
      fundingSource: formData.get('fundingSource') as string,
      programTitle: formData.get('programTitle') as string,
      applicationStartDate: startDate ? new Date(startDate) : undefined,
      applicationDeadline: new Date(endDate),
      minAmount: formData.get('minAmount') ? parseInt(formData.get('minAmount') as string) : undefined,
      maxAmount: formData.get('maxAmount') ? parseInt(formData.get('maxAmount') as string) : undefined,
      callDocumentationUrl: formData.get('callDocumentationUrl') as string || undefined,
      thematicArea: formData.get('thematicArea') as string || undefined,
      geographicScope: formData.get('geographicScope') as string || undefined,
      eligibilityCriteria: formData.get('eligibilityCriteria') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingGrant?.id) return;
    
    const formData = new FormData(e.currentTarget);
    const startDate = formData.get('applicationStartDate') as string;
    const endDate = formData.get('applicationDeadline') as string;
    
    updateMutation.mutate({
      id: editingGrant.id,
      fundingSource: formData.get('fundingSource') as string,
      programTitle: formData.get('programTitle') as string,
      applicationStartDate: startDate ? new Date(startDate) : undefined,
      applicationDeadline: new Date(endDate),
      minAmount: formData.get('minAmount') ? parseInt(formData.get('minAmount') as string) : undefined,
      maxAmount: formData.get('maxAmount') ? parseInt(formData.get('maxAmount') as string) : undefined,
      callDocumentationUrl: formData.get('callDocumentationUrl') as string || undefined,
      thematicArea: formData.get('thematicArea') as string || undefined,
      geographicScope: formData.get('geographicScope') as string || undefined,
      eligibilityCriteria: formData.get('eligibilityCriteria') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    });
  };

  const openEditDialog = (grant: any) => {
    setEditingGrant({
      id: grant.id,
      fundingSource: grant.fundingSource,
      programTitle: grant.programTitle,
      applicationStartDate: grant.applicationStartDate ? format(new Date(grant.applicationStartDate), 'yyyy-MM-dd') : '',
      applicationDeadline: format(new Date(grant.applicationDeadline), 'yyyy-MM-dd'),
      minAmount: grant.minAmount?.toString() || '',
      maxAmount: grant.maxAmount?.toString() || '',
      callDocumentationUrl: grant.callDocumentationUrl || '',
      thematicArea: grant.thematicArea || '',
      geographicScope: grant.geographicScope || '',
      eligibilityCriteria: grant.eligibilityCriteria || '',
      notes: grant.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (id: number) => {
    setGrantToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (grantToDelete) {
      deleteMutation.mutate({ id: grantToDelete });
    }
  };

  const filteredOpportunities = opportunities?.filter(opp =>
    opp.programTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.fundingSource.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    monitoring: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    preparing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    submitted: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    awarded: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  const GrantForm = ({ onSubmit, defaultValues, isPending }: { 
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; 
    defaultValues?: GrantFormData;
    isPending: boolean;
  }) => (
    <form onSubmit={onSubmit}>
      <DialogHeader>
        <DialogTitle>{defaultValues?.id ? 'Edit Grant Opportunity' : 'Create Grant Opportunity'}</DialogTitle>
        <DialogDescription>
          {defaultValues?.id ? 'Update the grant opportunity details' : 'Add a new grant opportunity for users to view'}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
        <div className="grid gap-2">
          <Label htmlFor="fundingSource">Organization / Funding Source *</Label>
          <Input
            id="fundingSource"
            name="fundingSource"
            placeholder="e.g., European Commission, Ford Foundation"
            defaultValue={defaultValues?.fundingSource}
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="programTitle">Grant Title *</Label>
          <Input
            id="programTitle"
            name="programTitle"
            placeholder="e.g., Horizon Europe - Social Innovation"
            defaultValue={defaultValues?.programTitle}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="callDocumentationUrl">Link / Documentation URL</Label>
          <Input
            id="callDocumentationUrl"
            name="callDocumentationUrl"
            type="url"
            placeholder="https://example.com/grant-details"
            defaultValue={defaultValues?.callDocumentationUrl}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="applicationStartDate">Application Start Date</Label>
            <Input
              id="applicationStartDate"
              name="applicationStartDate"
              type="date"
              defaultValue={defaultValues?.applicationStartDate}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="applicationDeadline">Application End Date *</Label>
            <Input
              id="applicationDeadline"
              name="applicationDeadline"
              type="date"
              defaultValue={defaultValues?.applicationDeadline}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="minAmount">Min Grant Amount (€)</Label>
            <Input
              id="minAmount"
              name="minAmount"
              type="number"
              placeholder="50000"
              defaultValue={defaultValues?.minAmount}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxAmount">Max Grant Amount (€)</Label>
            <Input
              id="maxAmount"
              name="maxAmount"
              type="number"
              placeholder="500000"
              defaultValue={defaultValues?.maxAmount}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="thematicArea">Thematic Area</Label>
          <Input
            id="thematicArea"
            name="thematicArea"
            placeholder="e.g., Education, Health, Environment"
            defaultValue={defaultValues?.thematicArea}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="geographicScope">Geographic Scope</Label>
          <Input
            id="geographicScope"
            name="geographicScope"
            placeholder="e.g., Europe, Global, Spain"
            defaultValue={defaultValues?.geographicScope}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="eligibilityCriteria">Eligibility Criteria</Label>
          <Textarea
            id="eligibilityCriteria"
            name="eligibilityCriteria"
            placeholder="Who can apply? What are the requirements?"
            rows={3}
            defaultValue={defaultValues?.eligibilityCriteria}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Additional notes or comments"
            rows={2}
            defaultValue={defaultValues?.notes}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.id ? 'Update' : 'Create'} Grant
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grant Opportunities</h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin 
              ? 'Manage and track funding opportunities for your organization' 
              : 'Browse available grant opportunities'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Dialog open={isCsvDialogOpen} onOpenChange={setIsCsvDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Grants from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to import multiple grants at once
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="csv-file">CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        setCsvFile(e.target.files?.[0] || null);
                        setImportResults(null);
                      }}
                    />
                  </div>
                  {importResults && (
                    <div className="rounded-lg border p-4 space-y-2">
                      <h4 className="font-medium">Import Results</h4>
                      <p className="text-sm text-muted-foreground">
                        Total: {importResults.total} | Success: {importResults.success} | Failed: {importResults.failed}
                      </p>
                      {importResults.errors.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-destructive">Errors:</p>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {importResults.errors.map((err, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground">
                                Row {err.row}: {err.error}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCsvUpload}
                    disabled={!csvFile || bulkImportMutation.isPending}
                  >
                    {bulkImportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Grant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <GrantForm onSubmit={handleCreate} isPending={createMutation.isPending} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </header>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search grants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="monitoring">Monitoring</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="awarded">Awarded</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grant List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOpportunities && filteredOpportunities.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOpportunities.map((grant) => (
            <Card key={grant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">{grant.programTitle}</CardTitle>
                    <CardDescription className="mt-1">{grant.fundingSource}</CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[grant.status]}`}>
                    {grant.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  {grant.applicationStartDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Opens: {format(new Date(grant.applicationStartDate), 'PPP')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Deadline: {format(new Date(grant.applicationDeadline), 'PPP')}</span>
                  </div>
                  {(grant.minAmount || grant.maxAmount) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {grant.minAmount && grant.maxAmount
                          ? `€${(grant.minAmount).toLocaleString()} - €${(grant.maxAmount).toLocaleString()}`
                          : grant.maxAmount
                          ? `Up to €${(grant.maxAmount).toLocaleString()}`
                          : `From €${(grant.minAmount).toLocaleString()}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {grant.callDocumentationUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(grant.callDocumentationUrl!, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(grant)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDelete(grant.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No grant opportunities found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {isAdmin ? 'Create your first grant opportunity to get started' : 'Check back later for new opportunities'}
            </p>
            {isAdmin && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Grant
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {isAdmin && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            {editingGrant && (
              <GrantForm 
                onSubmit={handleEdit} 
                defaultValues={editingGrant}
                isPending={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {isAdmin && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this grant opportunity. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
