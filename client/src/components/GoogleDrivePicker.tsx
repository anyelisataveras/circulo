import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2, FileIcon, Download, Search } from 'lucide-react';
import { toast } from 'sonner';

interface GoogleDrivePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileImported?: () => void;
}

export function GoogleDrivePicker({ open, onOpenChange, onFileImported }: GoogleDrivePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const { data: filesData, isLoading, refetch } = trpc.googleDrive.listFiles.useQuery(
    { query: searchQuery },
    { enabled: open }
  );

  const importMutation = trpc.googleDrive.importFile.useMutation({
    onSuccess: () => {
      toast.success('File imported from Google Drive successfully');
      onFileImported?.();
      onOpenChange(false);
      setSelectedFile(null);
      setCategory('');
      setDescription('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import file');
    },
  });

  const handleImport = () => {
    if (!selectedFile || !category) {
      toast.error('Please select a file and category');
      return;
    }

    importMutation.mutate({
      fileId: selectedFile.id,
      category,
      description,
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileIcon className="h-5 w-5" />;
    
    if (mimeType.includes('document')) return '📄';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('pdf')) return '📕';
    
    return <FileIcon className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from Google Drive</DialogTitle>
          <DialogDescription>
            Select a file from your Google Drive to import into your documents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => refetch()} variant="outline">
              Refresh
            </Button>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filesData?.files && filesData.files.length > 0 ? (
              <div className="divide-y">
                {filesData.files.map((file: any) => (
                  <div
                    key={file.id}
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      selectedFile?.id === file.id ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • Modified{' '}
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      {selectedFile?.id === file.id && (
                        <div className="text-primary font-medium">Selected</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <FileIcon className="h-12 w-12 mb-2" />
                <p>No files found</p>
              </div>
            )}
          </div>

          {/* Import Form */}
          {selectedFile && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grant Application">Grant Application</SelectItem>
                    <SelectItem value="Financial Documents">Financial Documents</SelectItem>
                    <SelectItem value="Legal Documents">Legal Documents</SelectItem>
                    <SelectItem value="Reports">Reports</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the document"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={importMutation.isPending || !category}>
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Import File
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
