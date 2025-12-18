import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
} from 'docx';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Helper to create a title paragraph
function createTitle(text: string, level?: typeof HeadingLevel[keyof typeof HeadingLevel]) {
  return new Paragraph({
    text,
    heading: level || HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
  });
}

// Helper to create body text
function createBodyText(text: string, bold = false, size = 24) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold,
        size: size, // Half-points (24 = 12pt)
      }),
    ],
    spacing: { before: 120, after: 120 },
  });
}

// Helper to create a section divider
function createDivider() {
  return new Paragraph({
    text: '---',
    spacing: { before: 200, after: 200 },
    alignment: AlignmentType.CENTER,
  });
}

// Create the Word document
const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        // COVER PAGE
        new Paragraph({
          children: [
            new TextRun({
              text: 'CARE COLLECTIVE',
              bold: true,
              size: 72, // 36pt
              color: '324158', // Navy
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 2400, after: 480 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Home Page Content',
              size: 48, // 24pt
              color: '5A7E79', // Sage
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Website Text & Style Guide',
              size: 32, // 16pt
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 960 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}`,
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 480 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'This document contains all the text content from the home page of the CARE Collective website. Edit the text as you wish, adjust font sizes to your preferences, and send it back. We\'ll update the website to match your changes.',
              size: 24,
            }),
          ],
          spacing: { before: 960, after: 240 },
        }),

        // PAGE BREAK
        new Paragraph({
          children: [new PageBreak()],
        }),

        // QUICK REFERENCE GUIDE
        createTitle('Quick Reference Guide', HeadingLevel.HEADING_1),

        // Font Size Table
        createTitle('Font Size Reference', HeadingLevel.HEADING_2),
        new Paragraph({
          text: 'Current font sizes used on the website:',
          spacing: { before: 120, after: 240 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Style', bold: true })] })],
                  shading: { fill: 'A3C4BF', type: ShadingType.SOLID }, // Sage light
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Size', bold: true })] })],
                  shading: { fill: 'A3C4BF', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Usage', bold: true })] })],
                  shading: { fill: 'A3C4BF', type: ShadingType.SOLID },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Hero Title')] }),
                new TableCell({ children: [new Paragraph('36px → 48px → 96px')] }),
                new TableCell({ children: [new Paragraph('Main headline only')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Section Titles')] }),
                new TableCell({ children: [new Paragraph('30px → 36px → 48px')] }),
                new TableCell({ children: [new Paragraph('Major section headings')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Subsection Titles')] }),
                new TableCell({ children: [new Paragraph('20px')] }),
                new TableCell({ children: [new Paragraph('Card titles, feature names')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Body Text (Large)')] }),
                new TableCell({ children: [new Paragraph('18px')] }),
                new TableCell({ children: [new Paragraph('Descriptions, paragraphs')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Body Text (Regular)')] }),
                new TableCell({ children: [new Paragraph('16px')] }),
                new TableCell({ children: [new Paragraph('Standard content')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Small Text')] }),
                new TableCell({ children: [new Paragraph('14px')] }),
                new TableCell({ children: [new Paragraph('Footer content')] }),
              ],
            }),
          ],
        }),

        // Font Weight Section
        createTitle('Font Weight Reference', HeadingLevel.HEADING_2),
        new Paragraph({
          children: [new TextRun({ text: 'Ultra Bold (Black): Hero main headline', bold: true })],
          spacing: { before: 120, after: 120 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Bold: Section titles, card headings', bold: true })],
          spacing: { before: 120, after: 120 },
        }),
        createBodyText('Semibold: Subtitles, feature names'),
        createBodyText('Medium: Emphasized descriptions'),
        createBodyText('Regular: Standard body text'),

        // Color Palette Section
        createTitle('Color Palette', HeadingLevel.HEADING_2),
        createBodyText('PRIMARY COLORS', true, 28),
        createBodyText('• Sage (Primary Green): #5A7E79 - Primary buttons and accents'),
        createBodyText('• Sage Dark: #4A6B66 - Hover states'),
        createBodyText('• Sage Light: #A3C4BF - Light backgrounds'),
        createBodyText('• Dusty Rose (Pink/Coral): #D8A8A0 - Secondary accent'),
        createBodyText('• Dusty Rose Accessible: #9A6B61 - WCAG compliant'),

        new Paragraph({ text: '' }),
        createBodyText('LEGACY/ADDITIONAL COLORS', true, 28),
        createBodyText('• Terracotta: #BC6547 - Orange-red accent'),
        createBodyText('• Navy: #324158 - Header background'),
        createBodyText('• Brown: #483129 - Main text color'),
        createBodyText('• Cream: #FBF2E9 - Page background'),
        createBodyText('• White: #FFFFFF - Card backgrounds'),

        new Paragraph({ text: '' }),
        createBodyText('ACTION COLORS', true, 28),
        new Paragraph({
          children: [
            new TextRun({ text: '⚠️ ', size: 28 }),
            new TextRun({ text: 'Logout Button Red: ', bold: true, size: 24 }),
            new TextRun({ text: '#D32F2F', bold: true, size: 28, color: 'D32F2F' }),
            new TextRun({ text: ' (The red from the logout button!)', size: 24 }),
          ],
          spacing: { before: 120, after: 120 },
        }),
        createBodyText('• Success Green: #388E3C'),
        createBodyText('• Warning Orange: #F57C00'),

        // PAGE BREAK
        new Paragraph({
          children: [new PageBreak()],
        }),

        // HOME PAGE CONTENT
        createTitle('Home Page Content', HeadingLevel.HEADING_1),

        // SECTION 1: HERO
        createTitle('Section 1: HERO (Top of Page)', HeadingLevel.HEADING_2),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Main Headline (Ultra Bold, 96px on desktop):',
              bold: true,
              size: 26,
            }),
          ],
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Southwest Missouri',
              bold: true,
              size: 56,
              color: '5A7E79',
            }),
          ],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'CARE Collective',
              bold: true,
              size: 56,
            }),
          ],
          spacing: { after: 240 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Subtitle (Semibold, 24px):',
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 120, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'C', bold: true, size: 28 }),
            new TextRun({ text: 'aregiver ', size: 28 }),
            new TextRun({ text: 'A', bold: true, size: 28 }),
            new TextRun({ text: 'ssistance and ', size: 28 }),
            new TextRun({ text: 'R', bold: true, size: 28 }),
            new TextRun({ text: 'esource ', size: 28 }),
            new TextRun({ text: 'E', bold: true, size: 28 }),
            new TextRun({ text: 'xchange', size: 28 }),
          ],
          spacing: { after: 240 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Description (Regular, 18px):',
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 120, after: 120 },
        }),
        createBodyText(
          'The CARE Collective is a network of family caregivers in Southwest Missouri who support each other through practical help and shared resources.',
          false,
          28
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Buttons:',
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 240, after: 120 },
        }),
        createBodyText('1. "Join Our Community" (Sage button, white text)'),
        createBodyText('2. "Learn How It Works" (White button, sage text)'),

        createDivider(),

        // SECTION 2: HOW IT WORKS
        createTitle('Section 2: HOW IT WORKS', HeadingLevel.HEADING_2),
        new Paragraph({
          children: [
            new TextRun({
              text: 'How It Works',
              bold: true,
              size: 48,
            }),
          ],
          spacing: { before: 240, after: 240 },
        }),

        new Paragraph({
          children: [new TextRun({ text: 'Three Steps:', bold: true })],
          spacing: { before: 120, after: 120 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Step 1: Join the Community (Card Title, Bold, 20px)',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Sign up with your basic information to become part of our trusted community network.'
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Step 2: Request or Offer Help (Card Title, Bold, 20px)',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Post what you need help with, or browse requests to see how you can assist others.'
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Step 3: Connect with Neighbors (Card Title, Bold, 20px)',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Build meaningful relationships while giving and receiving support in your community.'
        ),

        new Paragraph({
          text: 'Button: "Get Started Today"',
          spacing: { before: 240, after: 120 },
        }),

        createDivider(),

        // PAGE BREAK
        new Paragraph({
          children: [new PageBreak()],
        }),

        // SECTION 3: WHY JOIN
        createTitle('Section 3: WHY JOIN?', HeadingLevel.HEADING_2),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Why Join?',
              bold: true,
              size: 48,
            }),
          ],
          spacing: { before: 240, after: 240 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Subtitle (Semibold, 24px):',
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          "The CARE Collective connects you with other caregivers who understand what you're going through and are ready to help and be helped.",
          false,
          28
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: "As a member, you'll have access to:",
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 240, after: 120 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '1. Practical help when you need it (Bold, 18px)',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Get support with respite, errands, paperwork, or just someone to check in.'
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: '2. Mutual exchange of support (Bold, 18px)',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Caregivers helping each other meet real, practical needs. Give what you can, receive what you need. Everyone has something to offer, and everyone needs help sometimes.'
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: '3. Flexibility that works for you (Bold, 18px)',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          "Participate in ways that fit your schedule and capacity, whether that's offering a ride once a month or connecting for weekly check-ins."
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: '4. Learning opportunities (Bold, 18px)',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Attend workshops on topics that matter to you, from advance care planning to caregiver self-care.'
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: '5. No pressure, just support (Bold, 18px)',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          "Feeling overwhelmed? Don't have much free time? Worried you don't have much to offer? You belong here, and it's okay to be in a season where you mostly need support."
        ),

        new Paragraph({
          text: 'Button: "Join Our Community"',
          spacing: { before: 240, after: 120 },
        }),

        createDivider(),

        // PAGE BREAK
        new Paragraph({
          children: [new PageBreak()],
        }),

        // SECTION 4: ABOUT CARE COLLECTIVE
        createTitle('Section 4: ABOUT CARE COLLECTIVE', HeadingLevel.HEADING_2),
        new Paragraph({
          children: [
            new TextRun({
              text: 'About CARE Collective',
              bold: true,
              size: 48,
            }),
          ],
          spacing: { before: 240, after: 240 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Who We Are (Card Title, Bold, 24px)',
              bold: true,
              size: 32,
            }),
          ],
          spacing: { before: 120, after: 120 },
        }),
        createBodyText(
          'The CARE (Caregiver Assistance and Resource Exchange) Collective is a network of family caregivers in Southwest Missouri who support each other through practical help and shared resources. The Collective is powered by caregivers themselves, along with students and volunteers who help maintain the site and coordinate outreach and engagement. Together, we are building a space where caregivers find connection, practical help, and the mutual support that makes caregiving sustainable.',
          false,
          26
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Academic Partnership (Card Title, Bold, 24px)',
              bold: true,
              size: 32,
            }),
          ],
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'This project was created by ',
              size: 26,
            }),
            new TextRun({
              text: 'Dr. Maureen Templeman',
              bold: true,
              size: 26,
            }),
            new TextRun({
              text: ', Department of Sociology, Anthropology, and Gerontology at Missouri State University, with support from community partners and funding from the ',
              size: 26,
            }),
            new TextRun({
              text: 'Southern Gerontological Society Innovative Projects Grant',
              bold: true,
              size: 26,
            }),
            new TextRun({
              text: '.',
              size: 26,
            }),
          ],
          spacing: { after: 240 },
        }),

        new Paragraph({
          text: 'Button: "Learn More About Us"',
          spacing: { before: 240, after: 120 },
        }),

        createDivider(),

        // SECTION 5: WHAT'S HAPPENING
        createTitle("Section 5: WHAT'S HAPPENING", HeadingLevel.HEADING_2),
        new Paragraph({
          children: [
            new TextRun({
              text: "What's Happening",
              bold: true,
              size: 48,
            }),
          ],
          spacing: { before: 240, after: 240 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Two Columns:',
              bold: true,
              size: 26,
            }),
          ],
          spacing: { before: 120, after: 120 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Column 1: Upcoming Events (Header, Bold, 24px)',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Events load dynamically from database. Fallback text: "Events Coming Soon"'
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Column 2: Community Updates (Header, Bold, 24px)',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Updates load dynamically from database. Fallback text: "Stay Tuned"'
        ),

        new Paragraph({
          text: 'Button: "View All in Member Portal"',
          spacing: { before: 240, after: 120 },
        }),

        createDivider(),

        // SECTION 6: COMMUNITY RESOURCES
        createTitle('Section 6: COMMUNITY RESOURCES', HeadingLevel.HEADING_2),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Community Resources',
              bold: true,
              size: 48,
            }),
          ],
          spacing: { before: 240, after: 240 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Subtitle (Regular, 18px):',
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Connect with trusted local and regional organizations that offer practical support, guidance, and connection.',
          false,
          26
        ),

        new Paragraph({
          children: [new TextRun({ text: 'Four Resource Cards (Card Title, Bold, 20px):', bold: true })],
          spacing: { before: 240, after: 120 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '1. Essentials', bold: true, size: 28 }),
          ],
          spacing: { before: 60, after: 30 },
        }),
        createBodyText('Food, housing, and everyday needs'),

        new Paragraph({
          children: [
            new TextRun({ text: '2. Well-Being', bold: true, size: 28 }),
          ],
          spacing: { before: 60, after: 30 },
        }),
        createBodyText('Emotional health and caregiving support'),

        new Paragraph({
          children: [
            new TextRun({ text: '3. Community', bold: true, size: 28 }),
          ],
          spacing: { before: 60, after: 30 },
        }),
        createBodyText('Local programs and connections'),

        new Paragraph({
          children: [
            new TextRun({ text: '4. Learning', bold: true, size: 28 }),
          ],
          spacing: { before: 60, after: 30 },
        }),
        createBodyText('Training and educational programs'),

        new Paragraph({
          text: 'Button: "View All Resources"',
          spacing: { before: 240, after: 120 },
        }),

        createDivider(),

        // PAGE BREAK
        new Paragraph({
          children: [new PageBreak()],
        }),

        // SECTION 7: GET IN TOUCH
        createTitle('Section 7: GET IN TOUCH', HeadingLevel.HEADING_2),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Get in Touch',
              bold: true,
              size: 48,
            }),
          ],
          spacing: { before: 240, after: 240 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Subtitle (Regular, 18px):',
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText("Have questions or feedback? We're here to help.", false, 26),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Email Card:',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Email Us', bold: true, size: 32 }),
          ],
          spacing: { after: 60 },
        }),
        createBodyText('swmocarecollective@gmail.com', false, 28),

        new Paragraph({
          text: 'Button: "Visit Full Contact Page"',
          spacing: { before: 240, after: 120 },
        }),

        createDivider(),

        // SECTION 8: FOOTER
        createTitle('Section 8: FOOTER (Navy Background)', HeadingLevel.HEADING_2),

        new Paragraph({
          children: [new TextRun({ text: 'Four Columns:', bold: true })],
          spacing: { before: 120, after: 120 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Column 1 - Branding:', bold: true, size: 26 }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText('Heading: "CARE Collective" (Sage light)', false, 24),
        createBodyText(
          'Tagline: "Community mutual support for Southwest Missouri"',
          false,
          24
        ),

        new Paragraph({
          children: [
            new TextRun({ text: 'Column 2 - Contact:', bold: true, size: 26 }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText('Heading: "CONTACT"', false, 24),
        createBodyText('Dr. Maureen Templeman', false, 24),
        createBodyText('Springfield, MO', false, 24),
        createBodyText('swmocarecollective@gmail.com', false, 24),

        new Paragraph({
          children: [
            new TextRun({ text: 'Column 3 - Get Started:', bold: true, size: 26 }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText('Heading: "GET STARTED"', false, 24),
        createBodyText('Join Community', false, 24),
        createBodyText('Member Login', false, 24),

        new Paragraph({
          children: [
            new TextRun({ text: 'Column 4 - Resources:', bold: true, size: 26 }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText('Heading: "RESOURCES"', false, 24),
        createBodyText('Help & Support', false, 24),
        createBodyText('Terms of Service', false, 24),
        createBodyText('Privacy Policy', false, 24),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Copyright:',
              bold: true,
              size: 26,
            }),
          ],
          spacing: { before: 240, after: 60 },
        }),
        createBodyText(
          '© 2025 CARE Collective - Southwest Missouri. All rights reserved.',
          false,
          24
        ),

        // PAGE BREAK
        new Paragraph({
          children: [new PageBreak()],
        }),

        // INSTRUCTIONS FOR CLIENT
        createTitle('Instructions for Editing This Document', HeadingLevel.HEADING_1),

        new Paragraph({
          children: [
            new TextRun({
              text: 'How to Edit This Document:',
              bold: true,
              size: 32,
            }),
          ],
          spacing: { before: 240, after: 240 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '1. Changing Text:', bold: true, size: 26 }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText('Simply click on any text and type your changes.', false, 24),

        new Paragraph({
          children: [
            new TextRun({ text: '2. Adjusting Font Sizes:', bold: true, size: 26 }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Refer to the Quick Reference Guide (Page 2) for current sizes, then:',
          false,
          24
        ),
        createBodyText('• Select the text', false, 24),
        createBodyText('• Use the font size dropdown in Word', false, 24),
        createBodyText('• Try different sizes to see what works best', false, 24),

        new Paragraph({
          children: [
            new TextRun({ text: '3. Making Text Bold/Unbold:', bold: true, size: 26 }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          'Select text and press Ctrl+B (Windows) or Cmd+B (Mac)',
          false,
          24
        ),

        new Paragraph({
          children: [
            new TextRun({ text: '4. Color Changes:', bold: true, size: 26 }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          "Colors are reference only in this document - we'll apply them on the website",
          false,
          24
        ),

        new Paragraph({
          children: [
            new TextRun({ text: '5. Adding New Sections:', bold: true, size: 26 }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText(
          "Just add new text anywhere - we'll format it to match the website style",
          false,
          24
        ),

        new Paragraph({
          children: [
            new TextRun({ text: '6. Save & Send Back:', bold: true, size: 26 }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        createBodyText('Save this document and email it back when ready', false, 24),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Important Notes:',
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 480, after: 240 },
        }),

        createBodyText(
          "• Don't worry about making it look perfect - focus on the text content and sizing preferences",
          false,
          24
        ),
        createBodyText(
          '• Mark any sections you want removed with "DELETE THIS SECTION"',
          false,
          24
        ),
        createBodyText(
          '• Add notes in [BRACKETS] for special instructions',
          false,
          24
        ),
        createBodyText(
          '• The actual website will look polished - this is just for content editing',
          false,
          24
        ),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Questions? Contact: swmocarecollective@gmail.com',
              italics: true,
              size: 24,
            }),
          ],
          spacing: { before: 480 },
          alignment: AlignmentType.CENTER,
        }),
      ],
    },
  ],
});

// Generate and save the document
async function generateDocument() {
  try {
    const buffer = await Packer.toBuffer(doc);
    const outputDir = join(process.cwd(), 'client-documents');
    const outputPath = join(outputDir, 'home-page-content.docx');

    // Create output directory if it doesn't exist
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(outputPath, buffer);
    console.log(`✅ Document created successfully at: ${outputPath}`);
    console.log(`📄 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Error generating document:', error);
    process.exit(1);
  }
}

generateDocument();
