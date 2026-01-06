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
                className="text-white/80 hover:text-sage-light transition-colors inline-flex items-center min-h-[44px] py-2 focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
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
                  className="text-white/80 hover:text-sage-light transition-colors inline-flex items-center min-h-[44px] py-2 focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                  aria-label="Join the community"
                >
                  Join Community
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-white/80 hover:text-sage-light transition-colors inline-flex items-center min-h-[44px] py-2 focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                  aria-label="Login as a member"
                >
                  Member Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Resources */}
          <div>
            <h4 className="text-sm font-semibold text-sage-light mb-3 uppercase tracking-wide">Resources</h4>
            <ul className="space-y-1 list-none text-sm" role="list">
              <li>
                <Link
                  href="/help"
                  className="text-white/80 hover:text-sage-light transition-colors inline-flex items-center min-h-[44px] py-2 focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                  aria-label="Get help and support"
                >
                  Help & Support
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-white/80 hover:text-sage-light transition-colors inline-flex items-center min-h-[44px] py-2 focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                  aria-label="View terms of service"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-white/80 hover:text-sage-light transition-colors inline-flex items-center min-h-[44px] py-2 focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded"
                  aria-label="View privacy policy"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
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
