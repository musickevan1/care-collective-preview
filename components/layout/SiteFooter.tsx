/**
 * @fileoverview Site Footer Component
 * Provides consistent footer with legal links, navigation, and platform information
 */

'use client';

import { ReactElement } from 'react';
import Link from 'next/link';
import { Heart, Shield, Mail, ExternalLink } from 'lucide-react';

interface FooterProps {
  // No props needed - self-contained component
}

export function SiteFooter(): ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#324158] text-white py-12" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-[#7A9E99]" />
              <span className="text-xl font-bold">CARE Collective</span>
            </div>
            <p className="text-sm text-gray-300">
              Building community through mutual support for family caregivers in Southwest Missouri.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Privacy-First Platform</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <nav aria-label="Quick links">
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/requests" 
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Browse Requests
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/requests/new" 
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Create Request
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/resources" 
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Resources
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/about" 
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    About Us
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Legal</h3>
            <nav aria-label="Legal links">
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/terms" 
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-1"
                  >
                    Terms of Service
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/privacy-policy" 
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-1"
                  >
                    Privacy Policy
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/privacy" 
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Privacy Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact & Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Support</h3>
            <div className="space-y-3 text-sm">
              <p className="text-gray-300">
                Questions or need help?
              </p>
              <a 
                href="mailto:support@carecollective.org"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@carecollective.org
              </a>
              <p className="text-xs text-gray-400 mt-4">
                Funded by the Southern Gerontological Society and the Department of Sociology, Anthropology, and Gerontology at Missouri State University.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-600 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {currentYear} CARE Collective. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">
            Funded by the Southern Gerontological Society and the Department of Sociology, Anthropology, and Gerontology at Missouri State University
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-black/20 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            <strong>Disclaimer:</strong> CARE Collective is a platform facilitator only. We do not verify members, supervise interactions, or guarantee the quality of help provided. 
            All interactions are at your own risk. Please use good judgment and follow safety precautions when meeting community members.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
