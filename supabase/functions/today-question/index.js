"use strict";
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const server_ts_1 = require("https://deno.land/std@0.131.0/http/server.ts");
const supabase_js__1_33_2_1 = require("https://esm.sh/@supabase/supabase-js@^1.33.2");
const supabase = (0, supabase_js__1_33_2_1.createClient)(
// Supabase API URL - env var exported by default when deployed.
(_a = Deno.env.get('SUPABASE_URL')) !== null && _a !== void 0 ? _a : '', 
// Supabase API ANON KEY - env var exported by default when deployed.
(_b = Deno.env.get('SUPABASE_ANON_KEY')) !== null && _b !== void 0 ? _b : '');
console.log("Hello from Functions!");
(0, server_ts_1.serve)((req) => __awaiter(void 0, void 0, void 0, function* () {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().substring(0, 10);
    const table = "questions";
    var { data, error } = yield supabase
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
    var storageResponse = yield supabase.storage.from('questions').createSignedUrl(`public/${date}.png`, 3600);
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
}));
// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
//# sourceMappingURL=index.js.map