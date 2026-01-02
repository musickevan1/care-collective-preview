/**
 * @fileoverview Public Page Footer Component
 * Provides consistent footer for public pages matching the homepage design
 */

import { ReactElement } from 'react';
import Link from 'next/link';

interface PublicPageFooterProps {
  // No props needed - self-contained component
}

export function PublicPageFooter(): ReactElement {
  return (
    <footer id="contact" className="bg-navy text-white py-8" role="contentinfo">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Column 1: Branding */}
          <div>
            <h3 className="text-lg font-bold text-sage-light mb-3">CARE Collective</h3>
            <p className="text-sm text-white/80">
              Funded by the Southern Gerontological Society and the Department of Sociology, Anthropology, and Gerontology at Missouri State University.
            </p>
          </div>

          {/* Column 2: Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-sage-light mb-3 uppercase tracking-wide">Contact</h4>
            <div className="space-y-1 text-sm">
              <p className="text-white/80">Dr. Maureen Templeman</p>
              <p className="text-white/80">Springfield, MO</p>
              <a
                href="mailto:swmocarecollective@gmail.com"
                className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                aria-label="Email Dr. Maureen Templeman at swmocarecollective@gmail.com"
              >
                swmocarecollective@gmail.com
              </a>
            </div>
          </div>

          {/* Column 3: Quick Actions */}
          <div>
            <h4 className="text-sm font-semibold text-sage-light mb-3 uppercase tracking-wide">Get Started</h4>
            <ul className="space-y-1 list-none text-sm" role="list">
              <li>
                <Link
                  href="/signup"
                  className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                  aria-label="Join the community"
                >
                  Join Community
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                  aria-label="Login as a member"
                >
                  Member Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal, Resources & Social */}
          <div>
            <h4 className="text-sm font-semibold text-sage-light mb-3 uppercase tracking-wide">Resources</h4>
            <ul className="space-y-1 list-none text-sm" role="list">
              <li>
                <Link
                  href="/help"
                  className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                  aria-label="Get help and support"
                >
                  Help & Support
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                  aria-label="View terms of service"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                  aria-label="View privacy policy"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
            <div className="mt-4">
              <a 
                href="https://www.facebook.com/profile.php?id=61582852599484"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/80 hover:text-sage-light transition-colors"
                aria-label="Follow us on Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Follow on Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 pt-4 mt-2 text-center">
          <p className="text-sm text-white/60">
            © 2025 CARE Collective - Southwest Missouri. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
