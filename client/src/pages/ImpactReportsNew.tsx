import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, File, Loader2, CheckCircle2, CalendarIcon, Copy, Save } from "lucide-react";
import { Streamdown } from "streamdown";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ImpactReportsNew() {
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { data: documents } = trpc.documents.list.useQuery({});

  const generateMutation = trpc.impactReports.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Impact report generated successfully!");
      setGeneratedReport(data.content);
      // Scroll to report
      setTimeout(() => {
        document.getElementById("generated-report")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onError: (error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const title = formData.get("title") as string;
    const focus = formData.get("focus") as string;

    if (!title?.trim()) {
      toast.error("Please enter a report title");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (selectedDocs.length === 0) {
      toast.error("Please select at least one document");
      return;
    }

    const period = `${format(startDate, "MMMM d, yyyy")} - ${format(endDate, "MMMM d, yyyy")}`;

    setReportTitle(title.trim());
    generateMutation.mutate({
      title: title.trim(),
      period,
      documentIds: selectedDocs,
      focus: focus?.trim() || undefined,
    });
  };

  const toggleDoc = (docId: number) => {
    setSelectedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const saveMutation = trpc.impactReports.save.useMutation({
    onSuccess: () => {
      toast.success("Report saved successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to save report: ${error.message}`);
    },
  });

  const handleCopyToClipboard = async () => {
    if (!generatedReport || !reportTitle) return;
    
    try {
      const formattedText = `${reportTitle}\n${'='.repeat(reportTitle.length)}\n\n${generatedReport}`;
      await navigator.clipboard.writeText(formattedText);
      toast.success("Report copied! Paste into Word or Google Docs to edit offline.");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSaveToDocuments = () => {
    if (!generatedReport || !reportTitle) return;
    
    const period = startDate && endDate 
      ? `${format(startDate, "MMMM d, yyyy")} - ${format(endDate, "MMMM d, yyyy")}`
      : "";

    saveMutation.mutate({
      title: reportTitle,
      content: generatedReport,
      period,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white">
        <div className="container py-16">
          <div className="flex items-center gap-4 mb-4">
            <Sparkles className="h-12 w-12" />
            <h1 className="text-4xl font-bold">AI Impact Reports</h1>
          </div>
          <p className="text-xl text-purple-100">
            Generate comprehensive, data-driven impact reports with artificial intelligence
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container py-12">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Generate New Impact Report</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Report Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., 2024 Annual Impact Report"
                  required
                />
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Reporting Period *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => startDate ? date < startDate : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <Label>Select Documents to Analyze *</Label>
                <p className="text-sm text-muted-foreground">
                  AI will extract real data from these documents (no synthetic information)
                </p>
                <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                  {documents && documents.length > 0 ? (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={`doc-${doc.id}`}
                          checked={selectedDocs.includes(doc.id)}
                          onCheckedChange={() => toggleDoc(doc.id)}
                        />
                        <label
                          htmlFor={`doc-${doc.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{doc.documentName}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No documents available. Upload documents first.
                    </p>
                  )}
                </div>
                {selectedDocs.length > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    <CheckCircle2 className="inline h-4 w-4 mr-1" />
                    {selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Focus Areas */}
              <div className="space-y-2">
                <Label htmlFor="focus">Focus Areas (optional)</Label>
                <Textarea
                  id="focus"
                  name="focus"
                  placeholder="Describe specific areas, projects, or achievements to highlight..."
                  rows={3}
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>How it works:</strong> AI analyzes your selected documents and extracts real impact data. 
                  All information includes footnote citations showing the source document. No synthetic data is generated.
                </p>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate with AI
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Report */}
        {generatedReport && (
          <Card className="max-w-4xl mx-auto mt-8" id="generated-report">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Generated Report</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCopyToClipboard}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" onClick={handleSaveToDocuments} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save to Documents
                  </Button>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <Copy className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <strong>To work offline:</strong> Click "Copy to Clipboard" above, then paste into Microsoft Word, Google Docs, 
                    or any text editor. You can then edit and format the report as needed.
                  </div>
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                <Streamdown>{generatedReport}</Streamdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
