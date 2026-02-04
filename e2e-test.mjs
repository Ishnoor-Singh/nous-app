// Nous App E2E Test Suite
// Tests habit/task sync between chat and UI pages

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, 'e2e-screenshots');
const BASE_URL = 'https://nous-app-gules.vercel.app';

// Helper to save screenshots with timestamps
async function screenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = join(SCREENSHOTS_DIR, `${timestamp}-${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log(`📸 Screenshot saved: ${path}`);
  return path;
}

// Helper to wait and log
async function waitAndLog(page, ms, message) {
  console.log(`⏳ ${message}...`);
  await page.waitForTimeout(ms);
}

async function runTests() {
  console.log('🚀 Starting Nous E2E Tests\n');
  
  // Create screenshots directory
  const { mkdir } = await import('fs/promises');
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Browser Error: ${msg.text()}`);
    }
  });
  
  try {
    // ============================================
    // TEST 1: Landing Page Check
    // ============================================
    console.log('\n📋 TEST 1: Landing Page Check');
    console.log('=' .repeat(50));
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await screenshot(page, '01-landing-page');
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check if we're on a sign-in page or the app
    const url = page.url();
    console.log(`Current URL: ${url}`);
    
    if (url.includes('sign-in') || url.includes('clerk')) {
      console.log('⚠️ Auth required - checking for demo/guest access...');
      await screenshot(page, '01b-auth-page');
      
      // Look for any "continue as guest" or demo option
      const guestButton = await page.$('text=guest');
      const demoButton = await page.$('text=demo');
      const continueButton = await page.$('text=Continue without');
      
      if (guestButton || demoButton || continueButton) {
        const btn = guestButton || demoButton || continueButton;
        await btn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '01c-after-guest');
      } else {
        console.log('❌ No guest access available - app requires authentication');
        console.log('📝 Note: Need to test with authenticated session or add test user');
      }
    }
    
    // ============================================
    // TEST 2: Direct Navigation to Chat
    // ============================================
    console.log('\n📋 TEST 2: Navigate to Chat Page');
    console.log('=' .repeat(50));
    
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle' });
    await waitAndLog(page, 2000, 'Waiting for chat to load');
    await screenshot(page, '02-chat-page');
    
    const chatUrl = page.url();
    console.log(`Chat URL: ${chatUrl}`);
    
    // Check for chat input
    const chatInput = await page.$('textarea, input[type="text"]');
    if (chatInput) {
      console.log('✅ Found chat input element');
    } else {
      console.log('❌ No chat input found');
    }
    
    // ============================================
    // TEST 3: Navigate to Habits Page
    // ============================================
    console.log('\n📋 TEST 3: Navigate to Habits Page');
    console.log('=' .repeat(50));
    
    await page.goto(`${BASE_URL}/habits`, { waitUntil: 'networkidle' });
    await waitAndLog(page, 2000, 'Waiting for habits page to load');
    await screenshot(page, '03-habits-page');
    
    const habitsUrl = page.url();
    console.log(`Habits URL: ${habitsUrl}`);
    
    // Look for habit-related elements
    const habitCards = await page.$$('[class*="habit"], [class*="Habit"]');
    console.log(`Found ${habitCards.length} potential habit elements`);
    
    // ============================================
    // TEST 4: Navigate to Tasks Page  
    // ============================================
    console.log('\n📋 TEST 4: Navigate to Tasks Page');
    console.log('=' .repeat(50));
    
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle' });
    await waitAndLog(page, 2000, 'Waiting for tasks page to load');
    await screenshot(page, '04-tasks-page');
    
    const tasksUrl = page.url();
    console.log(`Tasks URL: ${tasksUrl}`);
    
    // ============================================
    // TEST 5: Check API Endpoints Directly
    // ============================================
    console.log('\n📋 TEST 5: Test API Endpoints');
    console.log('=' .repeat(50));
    
    // Test the chat API
    console.log('Testing /api/chat...');
    const chatApiResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: 'Hello', 
            userId: 'test-e2e-user' 
          })
        });
        return { 
          status: res.status, 
          statusText: res.statusText,
          body: await res.text().catch(() => 'Could not read body')
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('Chat API Response:', JSON.stringify(chatApiResponse, null, 2));
    
    // Test the parse-task API
    console.log('\nTesting /api/parse-task...');
    const parseTaskResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/parse-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            input: 'call mom tomorrow at 3pm high priority' 
          })
        });
        return { 
          status: res.status, 
          statusText: res.statusText,
          body: await res.text().catch(() => 'Could not read body')
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('Parse Task API Response:', JSON.stringify(parseTaskResponse, null, 2));
    
    // Test the bot API
    console.log('\nTesting /api/bot...');
    const botApiResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: 'what are my habits?',
            userId: 'test-e2e-user',
            channel: 'test'
          })
        });
        return { 
          status: res.status, 
          statusText: res.statusText,
          body: await res.text().catch(() => 'Could not read body')
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('Bot API Response:', JSON.stringify(botApiResponse, null, 2));
    
    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('\nKey Findings:');
    console.log('- Landing page loads: ' + (title ? '✅' : '❌'));
    console.log('- Requires auth: ' + (url.includes('sign-in') ? '⚠️ Yes' : '✅ No'));
    console.log('- Chat API status: ' + (chatApiResponse.status || chatApiResponse.error));
    console.log('- Parse Task API status: ' + (parseTaskResponse.status || parseTaskResponse.error));
    console.log('- Bot API status: ' + (botApiResponse.status || botApiResponse.error));
    
  } catch (error) {
    console.error('❌ Test Error:', error);
    await screenshot(page, 'error-state');
  } finally {
    await browser.close();
    console.log('\n🏁 Tests completed');
  }
}

runTests().catch(console.error);
