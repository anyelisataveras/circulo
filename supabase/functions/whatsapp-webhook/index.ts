// =====================================================
// Circulo Grant Manager - WhatsApp Webhook Edge Function
// Version: 1.0.0
// Description: Handles incoming WhatsApp messages from N8N
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppMessage {
  phoneNumber: string;
  senderName?: string;
  messageType: "text" | "voice" | "image" | "document" | "video";
  messageContent?: string;
  mediaUrl?: string;
  timestamp?: string;
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

    // Verify webhook authentication (optional but recommended)
    const authHeader = req.headers.get("authorization");
    const webhookSecret = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse incoming message
    const message: WhatsAppMessage = await req.json();

    if (!message.phoneNumber || !message.messageType) {
      return new Response(
        JSON.stringify({ error: "Invalid message format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store media file if present
    let mediaFileKey: string | null = null;
    if (message.mediaUrl) {
      try {
        // Download media file
        const mediaResponse = await fetch(message.mediaUrl);
        const mediaBlob = await mediaResponse.blob();
        const mediaBuffer = await mediaBlob.arrayBuffer();

        // Generate unique filename
        const timestamp = Date.now();
        const extension = message.mediaUrl.split(".").pop()?.split("?")[0] || "bin";
        const fileName = `whatsapp/${message.phoneNumber}/${timestamp}.${extension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("whatsapp")
          .upload(fileName, mediaBuffer, {
            contentType: mediaBlob.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Failed to upload media:", uploadError);
        } else {
          mediaFileKey = uploadData.path;
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from("whatsapp")
            .getPublicUrl(fileName);
          
          message.mediaUrl = urlData.publicUrl;
        }
      } catch (error) {
        console.error("Error processing media:", error);
      }
    }

    // Handle voice messages - transcribe if needed
    let transcriptionStatus: "pending" | "processing" | "completed" | "failed" = "pending";
    if (message.messageType === "voice" && message.mediaUrl) {
      transcriptionStatus = "pending";
      // Transcription would be handled by a separate function or service
    }

    // Insert message into database
    const { data: insertedMessage, error: insertError } = await supabase
      .from("whatsapp_messages")
      .insert({
        phone_number: message.phoneNumber,
        sender_name: message.senderName,
        message_type: message.messageType,
        message_content: message.messageContent,
        original_audio_url: message.messageType === "voice" ? message.mediaUrl : null,
        transcription_status: message.messageType === "voice" ? transcriptionStatus : null,
        media_url: message.mediaUrl,
        media_file_key: mediaFileKey,
        metadata: message.metadata ? JSON.stringify(message.metadata) : null,
        received_at: message.timestamp ? new Date(message.timestamp) : new Date(),
        is_processed: false,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert message: ${insertError.message}`);
    }

    // Try to match user by phone number (optional)
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", `${message.phoneNumber}@whatsapp.local`)
      .single();

    if (user) {
      // Update message with user_id
      await supabase
        .from("whatsapp_messages")
        .update({ user_id: user.id })
        .eq("id", insertedMessage.id);
    }

    // Send notification to admins about new message
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title: "New WhatsApp Message",
        message: `New ${message.messageType} message from ${message.senderName || message.phoneNumber}`,
        type: "general",
        related_entity_type: "whatsapp_messages",
        related_entity_id: insertedMessage.id,
      }));

      await supabase.from("notifications").insert(notifications);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        messageId: insertedMessage.id,
        message: "Message received and stored successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in WhatsApp webhook:", error);
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
