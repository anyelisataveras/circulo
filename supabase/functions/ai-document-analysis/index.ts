// =====================================================
// Circulo Grant Manager - AI Document Analysis Edge Function
// Version: 1.0.0
// Description: Analyzes documents and generates impact reports
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisRequest {
  documentIds: number[];
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  focusAreas?: string[];
  language?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Parse request body
    const { documentIds, reportingPeriodStart, reportingPeriodEnd, focusAreas, language = "en" }: AnalysisRequest = await req.json();

    if (!documentIds || documentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No documents provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch documents from database
    const { data: documents, error: docError } = await supabase
      .from("documents")
      .select("*")
      .in("id", documentIds);

    if (docError) {
      throw new Error(`Failed to fetch documents: ${docError.message}`);
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: "No documents found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process documents and extract content
    const documentContents: Array<{ name: string; content: string; url: string }> = [];

    for (const doc of documents) {
      const mimeType = doc.mime_type?.toLowerCase() || "";
      const fileUrl = doc.file_url;

      // For PDFs and images, we'll pass the URL directly to OpenAI
      if (mimeType.includes("pdf") || mimeType.includes("image")) {
        documentContents.push({
          name: doc.document_name,
          content: `[Document: ${doc.document_name}]`,
          url: fileUrl,
        });
      } else {
        // For other file types, we'd need to extract text
        // This is a simplified version - in production, you'd use proper parsers
        try {
          const response = await fetch(fileUrl);
          const text = await response.text();
          documentContents.push({
            name: doc.document_name,
            content: text.substring(0, 10000), // Limit content length
            url: fileUrl,
          });
        } catch (error) {
          console.error(`Failed to fetch document ${doc.document_name}:`, error);
          documentContents.push({
            name: doc.document_name,
            content: `[Unable to extract content from ${doc.document_name}]`,
            url: fileUrl,
          });
        }
      }
    }

    // Build AI prompt
    const systemPrompt = `You are an expert impact report analyst for NGOs. Your task is to analyze documents and generate comprehensive impact reports based STRICTLY on the information found in the provided documents.

CRITICAL REQUIREMENTS:
1. Extract ONLY real data from the documents - NO synthetic or made-up information
2. Include footnote citations [Doc: filename] for ALL extracted information
3. If information is not found in documents, explicitly state "Information not available in provided documents"
4. Focus on quantitative metrics, beneficiary data, activities, outcomes, and impact
5. Structure the report professionally with clear sections

Reporting Period: ${reportingPeriodStart} to ${reportingPeriodEnd}
${focusAreas && focusAreas.length > 0 ? `Focus Areas: ${focusAreas.join(", ")}` : ""}
Language: ${language}`;

    const userPrompt = `Analyze the following documents and generate a comprehensive impact report:

${documentContents.map((doc, idx) => `
Document ${idx + 1}: ${doc.name}
Content: ${doc.content}
`).join("\n")}

Generate a detailed impact report with the following sections:
1. Executive Summary
2. Activities Implemented
3. Beneficiaries Reached
4. Quantitative Impact Metrics
5. Qualitative Outcomes
6. Challenges and Lessons Learned
7. Conclusions and Recommendations

Remember: Include footnote citations for ALL data points. Use format [Doc: filename].`;

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more factual output
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const openaiData = await openaiResponse.json();
    const reportContent = openaiData.choices[0].message.content;

    // Return the generated report
    return new Response(
      JSON.stringify({
        success: true,
        reportContent,
        documentsAnalyzed: documents.length,
        documentNames: documents.map(d => d.document_name),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in AI document analysis:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
