// =====================================================
// Circulo Grant Manager - Email Notification Edge Function
// Version: 1.0.0
// Description: Sends email notifications using Resend or SMTP
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  userId: number;
  recipientEmail: string;
  subject: string;
  emailType: string;
  templateName?: string;
  content: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  metadata?: Record<string, any>;
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

    // Get email service configuration
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@circulo.app";
    const fromName = Deno.env.get("FROM_NAME") || "Circulo Grant Manager";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Parse request body
    const emailRequest: EmailRequest = await req.json();

    if (!emailRequest.recipientEmail || !emailRequest.subject || !emailRequest.content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create email log entry
    const { data: emailLog, error: logError } = await supabase
      .from("email_logs")
      .insert({
        user_id: emailRequest.userId,
        recipient_email: emailRequest.recipientEmail,
        subject: emailRequest.subject,
        email_type: emailRequest.emailType,
        template_name: emailRequest.templateName,
        content: emailRequest.content,
        related_entity_type: emailRequest.relatedEntityType,
        related_entity_id: emailRequest.relatedEntityId,
        status: "pending",
        metadata: emailRequest.metadata ? JSON.stringify(emailRequest.metadata) : null,
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Failed to create email log: ${logError.message}`);
    }

    try {
      // Send email using Resend
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [emailRequest.recipientEmail],
          subject: emailRequest.subject,
          html: emailRequest.content,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text();
        throw new Error(`Resend API error: ${errorData}`);
      }

      const resendData = await resendResponse.json();

      // Update email log with success
      await supabase
        .from("email_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          metadata: JSON.stringify({
            ...(emailRequest.metadata || {}),
            resend_id: resendData.id,
          }),
        })
        .eq("id", emailLog.id);

      return new Response(
        JSON.stringify({
          success: true,
          emailLogId: emailLog.id,
          resendId: resendData.id,
          message: "Email sent successfully",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    } catch (sendError) {
      // Update email log with failure
      await supabase
        .from("email_logs")
        .update({
          status: "failed",
          error_message: sendError.message,
        })
        .eq("id", emailLog.id);

      throw sendError;
    }

  } catch (error) {
    console.error("Error in send email function:", error);
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
