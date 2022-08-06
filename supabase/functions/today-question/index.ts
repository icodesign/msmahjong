// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^1.33.2'

const supabase = createClient(
  // Supabase API URL - env var exported by default when deployed.
  Deno.env.get('SUPABASE_URL') ?? '',
  // Supabase API ANON KEY - env var exported by default when deployed.
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

console.log("Hello from Functions!");

serve(async (req: Request) => {  
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = yesterday.toISOString().substring(0, 10);
  const table = "questions";
  var { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('date', date);
  if (error || !data || data.length === 0) {
    console.error(`Failed to select questions on ${date}, error: ${JSON.stringify(error)}`);
    return new Response(JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }
  var question = data[0];
  var storageResponse = await supabase.storage.from('questions').createSignedUrl(`public/${date}.png`, 3600);
  if (storageResponse.error) {
    console.error(`Failed to generate screenshot image on ${date}, error: ${JSON.stringify(storageResponse.error)}`);
    return new Response(JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }
  question['screenshot'] = storageResponse.signedURL;
  return new Response(JSON.stringify(question), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
