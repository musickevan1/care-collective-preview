# Session B: Messaging System TypeScript Refactor

**Estimated time: 2-3 hours**
**Focus: Messaging-related files only**

---

## Prompt

Fix TypeScript errors in the Care Collective messaging system. Focus ONLY on messaging-related files.

### Target Files & Errors

#### `components/messaging/VirtualizedMessageList.tsx`
- `scrollToItem` method doesn't exist on List component
- ReactNode type mismatch for row renderer

#### `hooks/useMessagingQuery.ts`
- `sendMessage` export missing from service-v2
- `getConversationDetails` is private
- `next_cursor` doesn't exist on pagination type

#### `hooks/useMessagingIntegration.ts`
- Property 'name' on array type

#### `lib/messaging/client.ts`
- `message_type` missing in argument

#### `lib/messaging/encryption.ts`
- `ContactEncryptionService` private constructor
- Missing methods: `encryptContactData`, `decryptContactData`
- Event type literals not in union type

#### `lib/messaging/moderation.ts`
- Array element access on query results
- `conversation_id`, `conversations`, `sender_id` properties

#### `lib/messaging/service-v2.ts`
- Export `sendMessage` if missing

### Fix Approach

1. **Start with service-v2.ts** - understand the current API and what's exported
2. **Check interface alignment** - ensure callers match the service interface
3. **For VirtualizedMessageList** - check react-virtualized-list API documentation for correct method names
4. **For encryption** - determine if `ContactEncryptionService` needs public factory method or if callers need updating
5. **For moderation** - fix Supabase query result typing (array vs single object)

### Verification

After fixing, run:
```bash
npm run type-check 2>&1 | grep -E "(messaging|Message)"
```

### Commit

```bash
git add -A && git commit -m "fix: resolve TypeScript errors in messaging system

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Git Coordination Note

If running in parallel with Session A:
- First to finish: commit and push normally
- Second to finish: run `git pull --rebase` before committing

---

## Reference: Current Error Details

```
components/messaging/VirtualizedMessageList.tsx(327,27): error TS2339: Property 'scrollToItem' does not exist
components/messaging/VirtualizedMessageList.tsx(351,23): error TS2339: Property 'scrollToItem' does not exist
components/messaging/VirtualizedMessageList.tsx(479,10): error TS2322: Type ... not assignable to type 'ReactNode'
hooks/useMessagingQuery.ts(21,10): error TS2305: Module has no exported member 'sendMessage'
hooks/useMessagingQuery.ts(69,36): error TS2341: Property 'getConversationDetails' is private
hooks/useMessagingQuery.ts(102,34): error TS2339: Property 'next_cursor' does not exist
hooks/useMessagingIntegration.ts(111,34): error TS2339: Property 'name' does not exist on type '{ name: any; }[]'
lib/messaging/client.ts(215,39): error TS2345: Argument ... missing 'message_type'
lib/messaging/encryption.ts(46,30): error TS2673: Constructor is private
lib/messaging/encryption.ts(107,61): error TS2339: Property 'encryptContactData' does not exist
lib/messaging/encryption.ts(119,9): error TS2322: Type '"MESSAGE_ENCRYPTED"' not assignable
lib/messaging/moderation.ts(500,42): error TS2339: Property 'conversation_id' does not exist
lib/messaging/moderation.ts(554,27): error TS2339: Property 'sender_id' does not exist on type '{ sender_id: any; }[]'
```
