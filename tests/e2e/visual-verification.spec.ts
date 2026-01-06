/**
 * @fileoverview Visual Verification Tests for Client Feedback Implementation
 * Captures screenshots of all changed areas across 4 sprints (15 tasks)
 * 
 * Sprint 1: Typography Foundation (5 tasks)
 * Sprint 2: Landing Page Content (4 tasks)
 * Sprint 3: Page-Specific Updates (5 tasks)
 * Sprint 4: Admin Panel Enhancement (1 task - requires auth)
 * 
 * Date: January 6, 2026
 * Branch: feature/client-feedback-jan2026-sprints
 */

import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Deployment URLs
const PREVIEW_URL = 'https://care-collective-preview-git-featur-c67049-musickevan1s-projects.vercel.app'
const PRODUCTION_URL = 'https://care-collective-preview.vercel.app'

// Screenshot output directory
const SCREENSHOT_DIR = path.join(process.cwd(), 'docs/reports/screenshots')

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

test.describe('Visual Verification - Client Feedback Implementation', () => {
  
  test.describe('Landing Page - Desktop (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } })

    test('01 - Hero Section', async ({ page }) => {
      await page.goto(PREVIEW_URL)
      await page.waitForLoadState('networkidle')
      
      // Scroll to ensure hero is visible
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(500)
      
      // Verify "Southwest Missouri" is present (first occurrence)
      const heroText = page.locator('text=/Southwest Missouri/i').first()
      await expect(heroText).toBeVisible({ timeout: 10000 })
      
      // Capture hero section
      const heroSection = page.locator('section').first()
      await heroSection.screenshot({
        path: path.join(SCREENSHOT_DIR, '01-landing-desktop-hero.png'),
        animations: 'disabled'
      })
      
      console.log('✅ Captured: 01-landing-desktop-hero.png')
      console.log('   Verify: "Southwest Missouri" size (text-3xl/4xl/5xl)')
      console.log('   Verify: Hero image, section headings (clamp 36px-56px)')
    })

    test('02 - What is CARE Collective Section', async ({ page }) => {
      await page.goto(PREVIEW_URL)
      await page.waitForLoadState('networkidle')
      
      // Find "What is CARE Collective" section
      const whatIsSection = page.locator('text=/What is CARE Collective/i').locator('..')
      await whatIsSection.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      
      // Capture the section and surrounding context
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '02-landing-desktop-what-is-care.png'),
        fullPage: false,
        clip: await whatIsSection.boundingBox() || undefined,
        animations: 'disabled'
      })
      
      console.log('✅ Captured: 02-landing-desktop-what-is-care.png')
      console.log('   Verify: Section heading size increased')
      console.log('   Verify: ONLY ONE "Join Our Community" button (in "Why Join?" box)')
      console.log('   Verify: NO button in "How It Works" box')
    })

    test('03 - About CARE Collective / Who We Are Section', async ({ page }) => {
      await page.goto(PREVIEW_URL)
      await page.waitForLoadState('networkidle')
      
      // Find "Who We Are" section by ID
      const aboutSection = page.locator('#about')
      await aboutSection.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      
      // Capture the about section
      await aboutSection.screenshot({
        path: path.join(SCREENSHOT_DIR, '03-landing-desktop-about.png'),
        animations: 'disabled'
      })
      
      console.log('✅ Captured: 03-landing-desktop-about.png')
      console.log('   Verify: Both paragraphs have matching font sizes (text-2xl/3xl/32px)')
      console.log('   Verify: "Dr. Maureen Templeman, Founder" caption shows "Founder"')
    })
  })

  test.describe('Landing Page - Mobile (390x844)', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('04 - Hero Section (Mobile)', async ({ page }) => {
      await page.goto(PREVIEW_URL)
      await page.waitForLoadState('networkidle')
      
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(500)
      
      // Capture hero on mobile
      const heroSection = page.locator('section').first()
      await heroSection.screenshot({
        path: path.join(SCREENSHOT_DIR, '04-landing-mobile-hero.png'),
        animations: 'disabled'
      })
      
      console.log('✅ Captured: 04-landing-mobile-hero.png')
      console.log('   Verify: Text sizing readable (h1: 2rem, h2: 1.75rem, h3: 1.5rem, body: 18px)')
      console.log('   Verify: "Southwest Missouri" prominent')
    })

    test('05 - Who We Are Section (Mobile)', async ({ page }) => {
      await page.goto(PREVIEW_URL)
      await page.waitForLoadState('networkidle')
      
      // Find "Who We Are" section by ID
      const whoWeAreSection = page.locator('#about')
      await whoWeAreSection.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      
      // Capture the section
      await whoWeAreSection.screenshot({
        path: path.join(SCREENSHOT_DIR, '05-landing-mobile-about.png'),
        animations: 'disabled'
      })
      
      console.log('✅ Captured: 05-landing-mobile-about.png')
      console.log('   Verify: Content (Who We Are text) appears FIRST/TOP')
      console.log('   Verify: Photo appears SECOND/BELOW content')
    })
  })

  test.describe('Signup Page - Desktop (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } })
    
    test('06 - Signup Desktop', async ({ page }) => {
      await page.goto(`${PREVIEW_URL}/signup`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '06-signup-desktop.png'),
        fullPage: true,
        animations: 'disabled'
      })
      
      console.log('✅ Captured: 06-signup-desktop.png')
      console.log('   Verify: Subheading says "Create an account below"')
    })
  })

  test.describe('Signup Page - Mobile (390x844)', () => {
    test.use({ viewport: { width: 390, height: 844 } })
    
    test('07 - Signup Mobile', async ({ page }) => {
      await page.goto(`${PREVIEW_URL}/signup`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '07-signup-mobile.png'),
        fullPage: true,
        animations: 'disabled'
      })
      
      console.log('✅ Captured: 07-signup-mobile.png')
      console.log('   Verify: Text sizing readable on mobile')
    })
  })

  test.describe('Resources Page - Desktop (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } })
    
    test('08 - Resources Desktop', async ({ page }) => {
      await page.goto(`${PREVIEW_URL}/resources`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '08-resources-desktop.png'),
        fullPage: true,
        animations: 'disabled'
      })
      
      console.log('✅ Captured: 08-resources-desktop.png')
      console.log('   Verify: Section subheadings ("Well-Being", "Community", "Learning") are centered')
      console.log('   Verify: Hospice card says "Hospice Foundation for Outreach" (NOT "Local Hospice...")')
    })
  })

  test.describe('Resources Page - Mobile (390x844)', () => {
    test.use({ viewport: { width: 390, height: 844 } })
    
    test('09 - Resources Mobile', async ({ page }) => {
      await page.goto(`${PREVIEW_URL}/resources`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '09-resources-mobile.png'),
        fullPage: true,
        animations: 'disabled'
      })
      
      console.log('✅ Captured: 09-resources-mobile.png')
      console.log('   Verify: Text sizing readable')
    })
  })

  test.describe('Optional: Production Comparison', () => {
    test.skip('Production Landing Hero (for comparison)', async ({ page }) => {
      test.use({ viewport: { width: 1440, height: 900 } })
      
      await page.goto(PRODUCTION_URL)
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(500)
      
      const heroSection = page.locator('section').first()
      await heroSection.screenshot({
        path: path.join(SCREENSHOT_DIR, '01-production-landing-desktop-hero.png'),
        animations: 'disabled'
      })
      
      console.log('✅ Captured: 01-production-landing-desktop-hero.png (comparison)')
    })
  })
})

test.describe('Manual Verification Required (Authenticated Pages)', () => {
  test.skip('Dashboard - Requires Authentication', async () => {
    console.log('⏸️  MANUAL VERIFICATION REQUIRED:')
    console.log('   - Dashboard card headings (larger text-xl/2xl)')
    console.log('   - "Offer to Help" dialog text size and placeholder')
  })

  test.skip('Admin Panel - Requires Authentication', async () => {
    console.log('⏸️  MANUAL VERIFICATION REQUIRED:')
    console.log('   - Admin panel pending applications')
    console.log('   - Phone number display')
    console.log('   - Caregiving situation display')
    console.log('   - Email verification status badge')
  })
})
