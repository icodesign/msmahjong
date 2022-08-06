import playwright from 'playwright';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
const fs = require('fs').promises;

const tilesMap: Record<string, string> = {
  'paiga-m-man_1': '一万',
  'paiga-m-man_2': '二万',
  'paiga-m-man_3': '三万',
  'paiga-m-man_4': '四万',
  'paiga-m-man_5': '五万',
  'paiga-m-man_6': '六万',
  'paiga-m-man_7': '七万',
  'paiga-m-man_8': '八万',
  'paiga-m-man_9': '九万',
  'paiga-m-pin_1': '一饼',
  'paiga-m-pin_2': '二饼',
  'paiga-m-pin_3': '三饼',
  'paiga-m-pin_4': '四饼',
  'paiga-m-pin_5': '五饼',
  'paiga-m-pin_6': '六饼',
  'paiga-m-pin_7': '七饼',
  'paiga-m-pin_8': '八饼',
  'paiga-m-pin_9': '九饼',
  'paiga-m-sou_1': '一索',
  'paiga-m-sou_2': '二索',
  'paiga-m-sou_3': '三索',
  'paiga-m-sou_4': '四索',
  'paiga-m-sou_5': '五索',
  'paiga-m-sou_6': '六索',
  'paiga-m-sou_7': '七索',
  'paiga-m-sou_8': '八索',
  'paiga-m-sou_9': '九索',
  'paiga-m-kaze_ton': '东',
  'paiga-m-kaze_nan': '南',
  'paiga-m-kaze_sha': '西',
  'paiga-m-kaze_pei': '北',
  'paiga-m-sangen_haku': '白',
  'paiga-m-sangen_hatu': '发',
  'paiga-m-sangen_chun': '中',
  'paiga-m-aka_man_5': '红五万',
  'paiga-m-aka_pin_5': '红五饼',
  'paiga-m-aka_sou_5': '红五索',
};

type Question = {
  title: string;
  date: string;
  link: string;
}

async function fetchQuestion(): Promise<Question> {
  console.log('Fetching question');
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();  
  const page = await context.newPage();
  await page.goto('https://nnkr.jp/questions/recent');
  var desc = await page.$eval('.contents-left .q .detail p', el => el.innerHTML);
  if (desc.indexOf('<br') >= 0) {
    console.error("Long description");
    process.exit(1);
  }
  var title = await page.$eval('.contents-left .q .detail .title h3', el => el.textContent);
  if (!title) {
    console.error("Missing title");
    process.exit(1);
  }
  title = title.split(' ').slice(1).join(' ');
  var dora: string | null = null;
  const doraClasses = await page.$eval('.contents-left .q .detail .title h3 .paiga-m', el => el.className);
  if (!doraClasses) {
    console.error("Missing dora classes");
    process.exit(2);
  }
  doraClasses.split(' ').forEach((doraClass: string) => {
    if (doraClass && doraClass.startsWith('paiga-m-') && doraClass in tilesMap) {
      dora = tilesMap[doraClass];
      if (!dora) {
        console.error(`Unknown dora class: ${doraClass}`);
        return;
      }
    }
  });
  if (!dora) {
    console.error("Missing dora");
    process.exit(3);
  }
  const link = await page.$eval('.contents-left .q .footer a', el => el.getAttribute('href'));
  if (!link) {
    console.error("Missing link");
    process.exit(31);
  }
  const fullTitle = `何切 ${title} ${dora}`;
  const formattedTitle = fullTitle.replace(/\s+/g, ' ').trim();
  const time = await page.$eval('.contents-left .q .footer .date', el => el.textContent);
  if (!time) {
    console.error("Missing time");
    process.exit(4);
  }
  const date = new Date(new Date(Date.parse(time)).toDateString()).toISOString().substring(0, 10);
  await page.locator('.contents-left .q .detail .tehai').first().screenshot({ path: `./screenshot/${date}.png` });
  await context.close();
  await browser.close();
  console.log(`Fetched question: ${formattedTitle}, date: ${date}, link: ${link}`);
  return { title: formattedTitle, date, link };
}

async function saveQuestion(question: Question, supabase: SupabaseClient) {
  const table = 'questions';
  console.log(`Checking if question exists: ${question.date}`);
  var { data, error } = await supabase
    .from(table)
    .select('title')
    .eq('date', question.date);
  if (error || !data) {
    console.error(`Failed to select questions on ${question.date}, error: ${JSON.stringify(error)}`);
    process.exit(7);
  }
  if (data.length !== 0) {
    console.log(`The question for ${question.date} already exists`);
    return;
  }
  var { data, error } = await supabase
    .from(table)
    .select('title')
    .eq('link', question.link);
  if (error || !data) {
    console.error(`Failed to select questions on ${question.link}, error: ${JSON.stringify(error)}`);
    process.exit(7);
  }
  if (data.length !== 0) {
    console.log(`The question for ${question.link} already exists`);
    return;
  }
  console.log(`Saving question for ${question.date}`);
  var { data, error } = await supabase
    .from('questions')
    .insert([
      { title: question.title, date: question.date, link: question.link }
    ]);
  if (error) {
    console.error(`Failed to insert question on ${question.date}, error: ${JSON.stringify(error)}`);
    process.exit(8);
  }
  console.log(`Saved question for ${question.date} successfully`);
}

async function saveQuestionScreenshot(question: Question, supabase: SupabaseClient) {
  const fileData = await fs.readFile(`./screenshot/${question.date}.png`);
  const { data, error } = await supabase
    .storage
    .from('questions')
    .upload(`public/${question.date}.png`, fileData, {
      cacheControl: '3600',
      contentType: 'image/png',
      upsert: true
    });
  if (error) {
    console.error(`Failed to save question screenshot on ${question.date}, error: ${JSON.stringify(error)}`);
    process.exit(8);
  }
  console.log(`Saved question screenshot for ${question.date} successfully`);
}

(async () => {
  const key = process.env['SUPABASE_KEY'];
  if (!key) {
    console.log("Missing supabase key");
    process.exit(5);
  }
  const question = await fetchQuestion();
  const supabase = createClient('https://snvtdenjojullslnuljt.supabase.co', key);
  await saveQuestion(question, supabase);
  await saveQuestionScreenshot(question, supabase);
})();