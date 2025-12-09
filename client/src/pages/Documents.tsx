import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Upload, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Eye,
  Loader2,
  Search,
  Filter,
  Cloud,
  CloudOff
} from 'lucide-react';
import { GoogleDrivePicker } from '@/components/GoogleDrivePicker';
import { DocumentPreview } from '@/components/DocumentPreview';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';

export default function Documents() {
  const { t } = useTranslation();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; type?: string } | null>(null);
  const [isGoogleDrivePickerOpen, setIsGoogleDrivePickerOpen] = useState(false);

  const utils = trpc.useUtils();

  // Google Drive connection status
  const { data: driveStatus } = trpc.googleDrive.isConnected.useQuery();
  const { data: authUrlData } = trpc.googleDrive.getAuthUrl.useQuery(undefined, {
    enabled: false,
  });
  const disconnectMutation = trpc.googleDrive.disconnect.useMutation({
    onSuccess: () => {
      toast.success('Google Drive disconnected');
      utils.googleDrive.isConnected.invalidate();
    },
  });
  
  const { data: documents, isLoading } = trpc.documents.list.useQuery({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: searchQuery || undefined,
  });

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success(t('documents.uploadSuccess') || 'Document uploaded successfully');
      setIsUploadOpen(false);
      setUploadingFiles([]);
      setCategory('');
      setDescription('');
      utils.documents.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t('common.error') || 'An error occurred');
    },
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success(t('documents.deleteSuccess') || 'Document deleted');
      utils.documents.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t('common.error') || 'An error occurred');
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setUploadingFiles(acceptedFiles);
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (uploadingFiles.length === 0) {
      toast.error(t('documents.noFilesSelected') || 'Please select files to upload');
      return;
    }

    if (!category) {
      toast.error(t('documents.categoryRequired') || 'Please select a category');
      return;
    }

    try {
      // Upload files sequentially to avoid race conditions
      for (const file of uploadingFiles) {
        // Convert file to base64 using Promise
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result);
          };
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });

        // Upload to server
        await uploadMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          category,
          description,
          mimeType: file.type,
          size: file.size,
        });
      }
    } catch (error) {
      console.error('[Documents] Upload error:', error);
      toast.error(t('documents.uploadFailed') || 'Failed to upload document');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm(t('documents.confirmDelete') || 'Are you sure you want to delete this document?')) {
      deleteMutation.mutate({ id });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-8 w-8" />;
    if (mimeType.includes('pdf')) return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-2">
            Upload, manage, and organize your grant-related documents
          </p>
        </div>
        <div className="flex gap-2">
          {driveStatus?.connected ? (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsGoogleDrivePickerOpen(true)}
              >
                <Cloud className="mr-2 h-4 w-4" />
                Import from Drive
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                title="Disconnect Google Drive"
              >
                <CloudOff className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={async () => {
                const result = await utils.client.googleDrive.getAuthUrl.query();
                if (result?.authUrl) {
                  window.location.href = result.authUrl;
                }
              }}
            >
              <Cloud className="mr-2 h-4 w-4" />
              Connect Google Drive
            </Button>
          )}
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload documents related to your grant applications, reports, or organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-sm text-muted-foreground">
                    Drop files here...
                  </p>
                ) : (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 10MB
                    </p>
                  </div>
                )}
              </div>

              {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files</Label>
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <File className="h-4 w-4" />
                      <span className="text-sm flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grant_application">Grant Application</SelectItem>
                    <SelectItem value="financial">Financial Documents</SelectItem>
                    <SelectItem value="legal">Legal Documents</SelectItem>
                    <SelectItem value="reports">Reports</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the document"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="grant_application">Grant Application</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="reports">Reports</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.mimeType || '')}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{doc.fileName}</CardTitle>
                      <CardDescription className="text-xs">
                        {format(new Date(doc.uploadedAt), 'PPP')}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {doc.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {doc.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{doc.category?.replace('_', ' ')}</span>
                  <span>{formatFileSize(doc.size || 0)}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPreviewDoc({ url: doc.url, name: doc.fileName })}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = doc.url;
                      link.download = doc.fileName;
                      link.click();
                    }}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No documents yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first document to get started
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Google Drive Picker */}
      <GoogleDrivePicker
        open={isGoogleDrivePickerOpen}
        onOpenChange={setIsGoogleDrivePickerOpen}
        onFileImported={() => {
          utils.documents.list.invalidate();
        }}
      />

      {/* Document Preview */}
      {previewDoc && (
        <DocumentPreview
          open={!!previewDoc}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          fileUrl={previewDoc.url}
          fileName={previewDoc.name}
          fileType={previewDoc.type}
        />
      )}
    </div>
  );
}
