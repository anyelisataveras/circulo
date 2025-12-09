import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName: string;
  fileType?: string;
}

export function DocumentPreview({
  open,
  onOpenChange,
  fileUrl,
  fileName,
  fileType,
}: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine file type from extension if not provided
  const getFileType = () => {
    if (fileType) return fileType.toLowerCase();
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension || '';
  };

  const type = getFileType();

  // Check if file can be previewed
  const canPreview = () => {
    const previewableTypes = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'txt', 'md', 'csv'];
    return previewableTypes.includes(type);
  };

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  const handleOpenExternal = () => {
    window.open(fileUrl, '_blank');
  };

  const renderPreview = () => {
    if (!canPreview()) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-muted-foreground">
            Preview not available for this file type
          </p>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
        </div>
      );
    }

    // PDF Preview
    if (type === 'pdf') {
      return (
        <div className="w-full h-[70vh]">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError("Failed to load PDF");
            }}
            title={fileName}
          />
        </div>
      );
    }

    // Image Preview
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(type)) {
      return (
        <div className="flex items-center justify-center p-4 bg-muted/20">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-[70vh] object-contain"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError("Failed to load image");
            }}
          />
        </div>
      );
    }

    // Text/CSV Preview
    if (['txt', 'md', 'csv'].includes(type)) {
      return (
        <div className="w-full h-[70vh] overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError("Failed to load file");
            }}
            title={fileName}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate pr-4">
              {fileName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File Instead
              </Button>
            </div>
          ) : (
            renderPreview()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
