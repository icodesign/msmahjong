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

const tilesMap: Record<string, string> = {
  'man_1': '一万',
  'man_2': '二万',
  'man_3': '三万',
  'man_4': '四万',
  'man_5': '五万',
  'man_6': '六万',
  'man_7': '七万',
  'man_8': '八万',
  'man_9': '九万',
  'pin_1': '一饼',
  'pin_2': '二饼',
  'pin_3': '三饼',
  'pin_4': '四饼',
  'pin_5': '五饼',
  'pin_6': '六饼',
  'pin_7': '七饼',
  'pin_8': '八饼',
  'pin_9': '九饼',
  'sou_1': '一索',
  'sou_2': '二索',
  'sou_3': '三索',
  'sou_4': '四索',
  'sou_5': '五索',
  'sou_6': '六索',
  'sou_7': '七索',
  'sou_8': '八索',
  'sou_9': '九索',
  'kaze_ton': '东',
  'kaze_nan': '南',
  'kaze_sha': '西',
  'kaze_pei': '北',
  'sangen_haku': '白',
  'sangen_hatu': '发',
  'sangen_chun': '中',
  'aka_man_5': '红五万',
  'aka_pin_5': '红五饼',
  'aka_sou_5': '红五索',
};

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
  const response = await fetch('https://nnkr.jp/answers/result'+question['link']);
  const anwsers_json = await response.json();
  var votes: { answer: any; count: any; }[] = [];
  var total_count = 0;
  for (const json of anwsers_json) {
    var an = json['Answer']['answer'];
    var count = json['0']['count'];
    const answer = {
      'answer': an,
      'count': count
    };
    votes.push(answer);
    total_count += parseInt(count);
  }
  var answer_str = "";
  for (const vote of votes) {
    answer_str += tilesMap[vote['answer']] + " " + vote['count'] + "票 " + Math.round(parseFloat(vote['count']) / total_count * 100) + "%, ";
  }
  question['votes'] = votes;
  question['answer'] = answer_str;
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
