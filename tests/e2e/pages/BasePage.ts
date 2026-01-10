/**
 * @fileoverview Base page object class for E2E tests
 *
 * Provides common methods used across all page objects.
 */

import { Page, expect } from '@playwright/test'

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Wait for the page to finish loading
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Wait for a specific timeout (use sparingly, prefer specific waits)
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms)
  }

  /**
   * Check if the current viewport is mobile-sized
   */
  isMobile(): boolean {
    const viewport = this.page.viewportSize()
    return viewport ? viewport.width < 768 : false
  }

  /**
   * Take a screenshot with optional clipping
   */
  async takeScreenshot(
    name: string,
    options?: { fullPage?: boolean; clip?: { x: number; y: number; width: number; height: number } }
  ): Promise<Buffer> {
    return this.page.screenshot({
      path: `docs/reports/screenshots/${name}.png`,
      fullPage: options?.fullPage,
      clip: options?.clip,
    })
  }

  /**
   * Get all console errors from the page
   */
  collectConsoleErrors(): { errors: string[]; cleanup: () => void } {
    const errors: string[] = []

    const handler = (msg: { type: () => string; text: () => string }) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    }

    this.page.on('console', handler)

    return {
      errors,
      cleanup: () => {
        this.page.off('console', handler)
      },
    }
  }

  /**
   * Get all page errors (uncaught exceptions)
   */
  collectPageErrors(): { errors: Error[]; cleanup: () => void } {
    const errors: Error[] = []

    const handler = (error: Error) => {
      errors.push(error)
    }

    this.page.on('pageerror', handler)

    return {
      errors,
      cleanup: () => {
        this.page.off('pageerror', handler)
      },
    }
  }

  /**
   * Basic accessibility check - verify elements have proper ARIA attributes
   */
  async checkBasicAccessibility(): Promise<{
    passed: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    // Check for images without alt text
    const imagesWithoutAlt = await this.page.locator('img:not([alt])').count()
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} images without alt text`)
    }

    // Check for buttons without accessible names
    const buttonsWithoutName = await this.page
      .locator('button:not([aria-label]):not(:has-text(.))')
      .count()
    if (buttonsWithoutName > 0) {
      issues.push(`${buttonsWithoutName} buttons without accessible names`)
    }

    // Check for links without accessible names
    const linksWithoutName = await this.page
      .locator('a:not([aria-label]):not(:has-text(.))')
      .count()
    if (linksWithoutName > 0) {
      issues.push(`${linksWithoutName} links without accessible names`)
    }

    // Check for form inputs without labels
    const inputsWithoutLabels = await this.page
      .locator(
        'input:not([aria-label]):not([aria-labelledby]):not([id]):visible'
      )
      .count()
    if (inputsWithoutLabels > 0) {
      issues.push(`${inputsWithoutLabels} inputs without labels`)
    }

    return {
      passed: issues.length === 0,
      issues,
    }
  }

  /**
   * Verify focus management - check if expected element has focus
   */
  async verifyFocus(selector: string): Promise<void> {
    const element = this.page.locator(selector)
    await expect(element).toBeFocused()
  }

  /**
   * Verify keyboard navigation works
   */
  async tabToElement(selector: string, maxTabs: number = 20): Promise<boolean> {
    for (let i = 0; i < maxTabs; i++) {
      await this.page.keyboard.press('Tab')

      const focused = this.page.locator(':focus')
      const matches = await focused.locator(selector).count()

      if (matches > 0) {
        return true
      }
    }
    return false
  }

  /**
   * Check if an element is visible in the viewport
   */
  async isVisibleInViewport(selector: string): Promise<boolean> {
    const element = this.page.locator(selector)
    const box = await element.boundingBox()

    if (!box) return false

    const viewport = this.page.viewportSize()
    if (!viewport) return false

    return (
      box.y >= 0 &&
      box.y + box.height <= viewport.height &&
      box.x >= 0 &&
      box.x + box.width <= viewport.width
    )
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded()
  }

  /**
   * Get current URL path
   */
  getCurrentPath(): string {
    const url = new URL(this.page.url())
    return url.pathname
  }

  /**
   * Check if current URL matches pattern
   */
  urlMatches(pattern: RegExp | string): boolean {
    if (typeof pattern === 'string') {
      return this.page.url().includes(pattern)
    }
    return pattern.test(this.page.url())
  }
}
