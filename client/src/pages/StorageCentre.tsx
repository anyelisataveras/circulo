import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Loader2, Users, Filter, Calendar, Eye } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { DocumentPreview } from "@/components/DocumentPreview";

export default function StorageCentre() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; type?: string } | null>(null);

  // Fetch all users
  const { data: users, isLoading: usersLoading } = trpc.storageCenter.listUsers.useQuery();

  // Fetch documents for selected user with filters
  const { data: documents, isLoading: documentsLoading } = trpc.storageCenter.getUserDocuments.useQuery(
    { 
      userId: selectedUserId || undefined,
      documentType: documentType !== "all" ? documentType : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    { enabled: selectedUserId !== null }
  );

  const handleDownloadAll = async () => {
    if (!documents || documents.length === 0) {
      toast.error("No documents to download");
      return;
    }

    setIsDownloading(true);
    try {
      // Create ZIP file
      const zip = new JSZip();
      
      // Download all files and add to ZIP
      let successCount = 0;
      for (const doc of documents) {
        try {
          const response = await fetch(doc.fileUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          zip.file(doc.documentName, blob);
          successCount++;
        } catch (error) {
          console.error(`Failed to download ${doc.documentName}:`, error);
          toast.error(`Failed to download ${doc.documentName}`);
        }
      }
      
      if (successCount === 0) {
        toast.error("Failed to download any documents");
        return;
      }
      
      // Generate ZIP and trigger download
      const selectedUser = users?.find(u => u.id === selectedUserId);
      const userName = selectedUser?.name || `user_${selectedUserId}`;
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${userName.replace(/\s+/g, '_')}_documents.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${successCount} of ${documents.length} documents`);
    } catch (error: any) {
      toast.error(error.message || "Failed to download documents");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = async (doc: any) => {
    try {
      const response = await fetch(doc.fileUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${doc.documentName}`);
    } catch (error) {
      console.error(`Failed to download ${doc.documentName}:`, error);
      toast.error(`Failed to download ${doc.documentName}`);
    }
  };

  // Redirect if not admin
  if (user && user.role !== "admin") {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access the Storage Centre.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Storage Centre</h1>
        <p className="text-muted-foreground">
          Download user documents for external impact report building and data management
        </p>
      </div>

      <div className="grid gap-6">
        {/* User Selection Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Select User</CardTitle>
            </div>
            <CardDescription>
              Choose a user to view and download their documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Select
                  value={selectedUserId?.toString() || ""}
                  onValueChange={(value) => setSelectedUserId(parseInt(value))}
                  disabled={usersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={usersLoading ? "Loading users..." : "Select a user..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name || u.email} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleDownloadAll}
                disabled={!selectedUserId || !documents || documents.length === 0 || isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download All
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters Card */}
        {selectedUserId && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filters</CardTitle>
              </div>
              <CardDescription>
                Filter documents by type and date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Document Type Filter */}
                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select
                    value={documentType}
                    onValueChange={setDocumentType}
                  >
                    <SelectTrigger id="documentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Reports">Reports</SelectItem>
                      <SelectItem value="Budgets">Budgets</SelectItem>
                      <SelectItem value="Contracts">Contracts</SelectItem>
                      <SelectItem value="Proposals">Proposals</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date Filter */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* End Date Filter */}
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(documentType !== "all" || startDate || endDate) && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDocumentType("all");
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documents List Card */}
        {selectedUserId && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>User Documents</CardTitle>
              </div>
              <CardDescription>
                {documentsLoading
                  ? "Loading documents..."
                  : `${documents?.length || 0} document(s) found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{doc.documentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {doc.documentType} • {new Date(doc.createdAt).toLocaleDateString()} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewDoc({ url: doc.fileUrl, name: doc.documentName })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSingle(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No documents found for this user
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

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
