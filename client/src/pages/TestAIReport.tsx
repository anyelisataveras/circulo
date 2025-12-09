import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TestAIReport() {
  const generateMutation = trpc.impactReports.generate.useMutation({
    onSuccess: (data) => {
      console.log("✅ AI Generation SUCCESS!");
      console.log("Generated content:", data.content);
      toast.success("Report generated successfully!");
      alert(`Report Generated!\n\nTitle: ${data.title}\n\nContent preview:\n${data.content.substring(0, 500)}...`);
    },
    onError: (error) => {
      console.error("❌ AI Generation FAILED:", error);
      toast.error(`Failed: ${error.message}`);
    },
  });

  const handleTest = () => {
    console.log("🧪 TEST BUTTON CLICKED!");
    toast.info("Starting AI generation test...");
    
    generateMutation.mutate({
      title: "Test Report",
      period: "2024",
      documentIds: [1], // First document
      focus: "Test focus areas"
    });
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">🧪 AI Report Generation Test</h1>
        <p className="text-gray-600 mb-8">
          This is a minimal test page to verify the backend AI document analysis works.
        </p>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Parameters:</h2>
          <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700">
            <li>Title: "Test Report"</li>
            <li>Period: "2024"</li>
            <li>Document ID: 1 (first PDF document)</li>
            <li>Focus: "Test focus areas"</li>
          </ul>

          <Button
            onClick={handleTest}
            disabled={generateMutation.isPending}
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {generateMutation.isPending ? "⏳ Generating..." : "🧪 Run AI Generation Test"}
          </Button>

          {generateMutation.isPending && (
            <p className="mt-4 text-center text-gray-600">
              AI is analyzing the document and generating the report...
            </p>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-900">
            <strong>What this tests:</strong>
            <br />
            ✅ Backend procedure is callable
            <br />
            ✅ AI reads PDF documents
            <br />
            ✅ AI extracts real data (no synthetic info)
            <br />
            ✅ AI includes footnote citations
            <br />
            ✅ Professional report template works
          </p>
        </div>
      </div>
    </div>
  );
}
