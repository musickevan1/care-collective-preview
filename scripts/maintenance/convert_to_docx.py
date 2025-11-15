#!/usr/bin/env python3
"""
Convert CLIENT_MEETING_DOCUMENT.md to a Word document
Uses basic HTML generation and converts to RTF format which Word can open
"""

import re
import html

def markdown_to_rtf(markdown_content):
    """Convert basic markdown to RTF format"""

    # Start RTF document
    rtf = r'{\rtf1\ansi\deff0 {\fonttbl {\f0 Times New Roman;}}{\colortbl;\red0\green0\blue0;}\f0\fs24'

    lines = markdown_content.split('\n')
    in_code_block = False

    for line in lines:
        # Handle code blocks
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            continue

        if in_code_block:
            # Format code with monospace
            rtf += r'\f1\fs20 ' + html.escape(line) + r'\par\f0\fs24 '
            continue

        # Handle headers
        if line.startswith('# '):
            rtf += r'\b\fs32 ' + html.escape(line[2:]) + r'\b0\fs24\par '
        elif line.startswith('## '):
            rtf += r'\b\fs28 ' + html.escape(line[3:]) + r'\b0\fs24\par '
        elif line.startswith('### '):
            rtf += r'\b\fs26 ' + html.escape(line[4:]) + r'\b0\fs24\par '
        elif line.startswith('#### '):
            rtf += r'\b\fs24 ' + html.escape(line[5:]) + r'\b0\fs24\par '

        # Handle bold text
        elif '**' in line:
            # Simple bold replacement
            line = re.sub(r'\*\*(.*?)\*\*', r'\\b \1\\b0 ', line)
            rtf += html.escape(line) + r'\par '

        # Handle bullet points
        elif line.strip().startswith('- '):
            rtf += r'\bullet ' + html.escape(line.strip()[2:]) + r'\par '
        elif re.match(r'^\d+\. ', line.strip()):
            # Numbered lists
            rtf += html.escape(line.strip()) + r'\par '

        # Handle horizontal rules
        elif line.strip() == '---':
            rtf += r'\par\brdrb\brdrs\brdrw10\brsp20\par '

        # Regular paragraphs
        elif line.strip():
            rtf += html.escape(line) + r'\par '

        # Empty lines
        else:
            rtf += r'\par '

    # Close RTF document
    rtf += '}'

    return rtf

def main():
    # Read the markdown file
    with open('CLIENT_MEETING_DOCUMENT.md', 'r', encoding='utf-8') as f:
        markdown_content = f.read()

    # Convert to RTF
    rtf_content = markdown_to_rtf(markdown_content)

    # Write RTF file (Word can open RTF files)
    with open('CLIENT_MEETING_DOCUMENT.rtf', 'w', encoding='utf-8') as f:
        f.write(rtf_content)

    print("Successfully converted CLIENT_MEETING_DOCUMENT.md to CLIENT_MEETING_DOCUMENT.rtf")
    print("Word can open RTF files directly. If you need a .docx file, please open the RTF in Word and save as .docx")

if __name__ == "__main__":
    main()