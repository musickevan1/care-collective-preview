# Header Style Matching Homepage

## Status: Partially Complete

### Changes Made

**SectionHeader Component Updated** ✅
- Changed from icon-based header (like PageHeader) to simplified style
- Now matches homepage section header style:
  - `text-[clamp(32px,5vw,48px)] font-bold text-brown text-center uppercase tracking-wide`
  - No icon or description props
  - Simple, centered layout

**About Page Updated** ✅
- Removed PageHeader component import and usage
- Updated to simplified SectionHeader style
- Added first SectionHeader: "About CARE Collective"

**Resources Page In Progress** ⏳
- Main page header updated to homepage style (uppercase, tracking-wide, centered)
- Still has 4 SectionHeaders with icon/description props (lines 32, 75, 96, 124)
- Need to remove these to match simplified style

**Contact Page Pending** ⏳
- Still uses PageHeader import
- Still has SectionHeader with iconBgColor prop (line 95)

**Help Page Pending** ⏳
- Still uses PageHeader import
- Still has SectionHeaders with icon/description props

### What's Left

1. **Remove PageHeader imports** from:
   - app/resources/page.tsx
   - app/contact/page.tsx
   - app/help/page.tsx

2. **Update all SectionHeader calls** to simplified form:
   - Remove `iconBgColor` prop
   - Remove `icon` prop
   - Just use `title` prop
   - Or match homepage pattern (uppercase, tracking-wide, centered)

3. **Privacy Policy and Terms pages**
   - Currently don't have headers
   - May need section headers added

### Homepage Section Header Pattern

```tsx
<h2 className="text-[clamp(32px,5vw,48px)] font-bold text-brown text-center uppercase tracking-wide">
  {title}
</h2>

<p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed mb-12">
  {description}
</p>
```

### Next Steps

1. Complete Resources page SectionHeader cleanup (remove 4 SectionHeaders)
2. Update Contact page (remove PageHeader import, simplify SectionHeader)
3. Update Help page (remove PageHeader import, simplify SectionHeaders)
4. Consider if Privacy/Terms pages need section headers
5. Test all pages to ensure headers match homepage style
