import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { SMTPClient } from 'npm:emailjs@4.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendDocumentBody {
  documentName: string;
  pdfContent: string; // base64 encoded PDF
  recipients: Array<{
    email: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { documentName, pdfContent, recipients }: SendDocumentBody = await req.json();

    // Convert base64 PDF to bytes
    const pdfBytes = Uint8Array.from(atob(pdfContent.split(',')[1]), c => c.charCodeAt(0));

    // Insert document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        name: documentName,
        content: pdfBytes,
        sender_id: user.id,
      })
      .select()
      .single();

    if (documentError) {
      throw new Error(`Error saving document: ${documentError.message}`);
    }

    // Insert recipients
    const { error: recipientsError } = await supabase
      .from('document_recipients')
      .insert(
        recipients.map(recipient => ({
          document_id: document.id,
          email: recipient.email,
          status: 'pending'
        }))
      );

    if (recipientsError) {
      throw new Error(`Error saving recipients: ${recipientsError.message}`);
    }

    // Send emails to recipients using emailjs
    const smtp = new SMTPClient({
      host: Deno.env.get('SMTP_HOST') ?? '',
      port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      user: Deno.env.get('SMTP_USERNAME') ?? '',
      password: Deno.env.get('SMTP_PASSWORD') ?? '',
      ssl: true,
    });

    for (const recipient of recipients) {
      const signLink = `${Deno.env.get('APP_URL')}/sign/${document.id}`;
      
      await smtp.send({
        from: Deno.env.get('SMTP_FROM') ?? '',
        to: recipient.email,
        subject: `Document for signing: ${documentName}`,
        text: `
          You have received a document for signing: ${documentName}
          
          Click here to view and sign the document:
          ${signLink}
          
          This link will expire in 7 days.
        `,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document sent successfully',
        documentId: document.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});