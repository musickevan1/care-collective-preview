# Session C: Remaining TypeScript Fixes

**Estimated time: 30-45 minutes**
**Focus: Admin and validation files**

---

## Prompt

Fix the remaining TypeScript errors in Care Collective. These are the files not covered by Session A (utilities) or Session B (messaging).

### Target Files

| File | Error Count | Error Type |
|------|-------------|------------|
| `lib/supabase/admin.ts` | 8 | Property access on type 'never' |
| `lib/validations/cms.ts` | 2 | z.record() argument count |
| `lib/validations/contact-exchange.ts` | 1 | z.record() argument count |
| `lib/validations/email.ts` | 2 | Type assignment mismatch |

---

## Error Details

### `lib/supabase/admin.ts`
**Issue:** Supabase query result typed as `never` - likely missing type annotation or incorrect query chain.

```
(101,27): Property 'id' does not exist on type 'never'.
(102,29): Property 'name' does not exist on type 'never'.
(103,31): Property 'verification_status' does not exist on type 'never'.
(104,30): Property 'id' does not exist on type 'never'.
(105,44): Property 'id' does not exist on type 'never'.
(123,17): Property 'id' does not exist on type 'never'.
(126,36): Property 'id' does not exist on type 'never'.
(127,38): Property 'name' does not exist on type 'never'.
```

**Fix approach:**
- Check the Supabase query that returns this data
- Add proper type annotation or use `.returns<T>()` helper
- May need to define interface for expected return shape

### `lib/validations/cms.ts`
**Issue:** `z.record()` requires key type as first argument in Zod 3.x+

```
(18,14): Expected 2-3 arguments, but got 1.
(233,23): Expected 2-3 arguments, but got 1.
```

**Fix:** Change `z.record(valueSchema)` to `z.record(z.string(), valueSchema)`

### `lib/validations/contact-exchange.ts`
**Issue:** Same `z.record()` argument issue

```
(56,15): Expected 2-3 arguments, but got 1.
```

**Fix:** Change `z.record(valueSchema)` to `z.record(z.string(), valueSchema)`

### `lib/validations/email.ts`
**Issue 1:** Type `string | false` not assignable to `string | null`

```
(92,3): Type 'string | false' is not assignable to type 'string | null'.
```

**Fix:** Convert `false` to `null` using `|| null` or ternary

**Issue 2:** `ZodOptional<ZodString>` missing properties from `ZodString`

```
(289,5): Type 'ZodOptional<ZodString>' is missing properties from type 'ZodString'
```

**Fix:** Check if `.optional()` should be removed or if the type annotation is wrong

---

## Fix Approach

1. Read each file and understand the context
2. Apply minimal fixes (type annotations, z.record key types, null coercion)
3. Avoid refactoring - just fix the type errors
4. Verify with type-check after each file

---

## Verification

After fixing, run:
```bash
npm run type-check 2>&1 | grep -E "^(lib/supabase/admin|lib/validations)"
# Should return no output (no errors)
```

Full verification:
```bash
npm run type-check 2>&1 | grep -v "\.test\." | grep -v "tests/" | wc -l
# Should be significantly reduced
```

---

## Commit

```bash
git add -A && git commit -m "fix: resolve TypeScript errors in admin and validation files

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Reference: Pattern from Previous Sessions

### z.record() fix (from Session A)
```typescript
// Before (Zod 3.x error)
z.record(z.object({ ... }))

// After
z.record(z.string(), z.object({ ... }))
```

### Type 'never' fix
```typescript
// Before - TypeScript infers 'never' when it can't determine type
const { data } = await supabase.from('table').select('*')
data.id  // Error: Property 'id' does not exist on type 'never'

// After - Add explicit type
interface TableRow { id: string; name: string; }
const { data } = await supabase.from('table').select('*').returns<TableRow[]>()
// Or cast the result
const typedData = data as TableRow[]
```
