# React Native Implementation Guide

**Audience:** Developers implementing the React Native mobile app
**Prerequisites:** Understanding of React, TypeScript, and Care Collective web codebase
**Date:** January 2025

---

## Table of Contents

1. [Monorepo Setup](#monorepo-setup)
2. [Package Architecture](#package-architecture)
3. [Code Sharing Patterns](#code-sharing-patterns)
4. [Platform-Specific Implementations](#platform-specific-implementations)
5. [Supabase Integration](#supabase-integration)
6. [Navigation Setup](#navigation-setup)
7. [UI Component Adapters](#ui-component-adapters)
8. [Real-time Messaging](#real-time-messaging)
9. [Testing Strategy](#testing-strategy)
10. [Deployment](#deployment)

---

## Monorepo Setup

### Step 1: Initialize Turborepo

```bash
# Create new monorepo
npx create-turbo@latest care-collective

# Project structure will be created:
care-collective/
├── apps/
├── packages/
├── turbo.json
└── package.json
```

### Step 2: Move Existing Web App

```bash
# Move current app to apps/web
mkdir -p apps/web
mv app components lib public supabase apps/web/
mv next.config.js tsconfig.json tailwind.config.ts apps/web/

# Update apps/web/package.json
cd apps/web
npm init -y
```

**apps/web/package.json:**
```json
{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@care/core": "workspace:*",
    "@care/services": "workspace:*",
    "@care/hooks": "workspace:*",
    "next": "14.2.32",
    "react": "^18.3.1",
    "// ... other dependencies": ""
  }
}
```

### Step 3: Create Package Structure

```bash
# Create shared packages
mkdir -p packages/{core,services,hooks,ui-primitives}

# Initialize each package
for pkg in core services hooks ui-primitives; do
  cd packages/$pkg
  npm init -y
  mkdir -p src
  touch src/index.ts
  cd ../..
done
```

### Step 4: Configure Turborepo

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

**Root package.json:**
```json
{
  "name": "care-collective",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "web": "turbo run dev --filter=web",
    "mobile": "turbo run start --filter=mobile"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Package Architecture

### packages/core - Shared Types & Validation

**Purpose:** Platform-agnostic types, constants, and validation schemas

**packages/core/package.json:**
```json
{
  "name": "@care/core",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**packages/core/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**packages/core/src/index.ts:**
```typescript
// Types
export * from './types/database'
export * from './types/messaging'
export * from './types/help-requests'

// Validations
export * from './validations/help-request'
export * from './validations/contact-exchange'
export * from './validations/messaging'
export * from './validations/auth'

// Constants
export * from './constants/categories'
export * from './constants/statuses'
```

**packages/core/src/validations/help-request.ts:**
```typescript
import { z } from 'zod'

export const helpRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().max(1000).optional(),
  category: z.enum([
    'groceries',
    'transport',
    'household',
    'medical',
    'meals',
    'childcare',
    'pet_care',
    'errands',
    'emotional_support',
    'other'
  ]),
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal'),
  location: z.string().min(1, 'Location is required'),
  locationPrivacy: z.enum(['public', 'helpers_only', 'after_match']).default('public'),
})

export type HelpRequestInput = z.infer<typeof helpRequestSchema>

export const helpRequestFiltersSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']).optional(),
  category: helpRequestSchema.shape.category.optional(),
  urgency: helpRequestSchema.shape.urgency.optional(),
  location: z.string().optional(),
})

export type HelpRequestFilters = z.infer<typeof helpRequestFiltersSchema>
```

**packages/core/src/types/database.ts:**
```typescript
// Re-export generated types from Supabase
export type { Database } from './database.generated'

// Helper types
export type HelpRequest = Database['public']['Tables']['help_requests']['Row']
export type HelpRequestInsert = Database['public']['Tables']['help_requests']['Insert']
export type HelpRequestUpdate = Database['public']['Tables']['help_requests']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']

// Composite types
export interface HelpRequestWithProfile extends HelpRequest {
  profiles: Pick<Profile, 'name' | 'location'> | null
}

export interface MessageWithSender extends Message {
  sender: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
  recipient?: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
}

export interface ConversationWithDetails extends Conversation {
  help_requests?: HelpRequest | null
  conversation_participants: Array<{
    user_id: string
    profiles: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
  }>
  unread_count?: number
  last_message?: Pick<Message, 'content' | 'created_at' | 'sender_id'> | null
}
```

---

### packages/services - Business Logic

**Purpose:** Platform-agnostic business logic and Supabase operations

**packages/services/package.json:**
```json
{
  "name": "@care/services",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "@care/core": "workspace:*",
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.4"
  }
}
```

**packages/services/src/messaging/client.ts:**
```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, MessageWithSender, ConversationWithDetails } from '@care/core/types'
import { messagingValidation } from '@care/core/validations'

export interface PaginationParams {
  page: number
  limit: number
}

export interface MessagesResponse {
  messages: MessageWithSender[]
  total: number
  hasMore: boolean
}

export class MessagingClient {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getConversations(
    userId: string,
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<{ conversations: ConversationWithDetails[]; total: number }> {
    const offset = (pagination.page - 1) * pagination.limit

    const { data: conversations, error, count } = await this.supabase
      .from('conversations')
      .select(`
        *,
        help_requests (*),
        conversation_participants!inner (
          user_id,
          profiles (id, name, avatar_url)
        )
      `, { count: 'exact' })
      .eq('conversation_participants.user_id', userId)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to fetch conversations: ${error.message}`)

    // Enrich with unread counts and last messages
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        const [unreadCount, lastMessage] = await Promise.all([
          this.getUnreadMessageCount(conv.id, userId),
          this.getLastMessage(conv.id)
        ])

        return {
          ...conv,
          unread_count: unreadCount,
          last_message: lastMessage
        } as ConversationWithDetails
      })
    )

    return {
      conversations: conversationsWithDetails,
      total: count || 0
    }
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'system' = 'text'
  ): Promise<MessageWithSender> {
    // Validate input
    const validated = messagingValidation.sendMessage.parse({
      conversation_id: conversationId,
      content
    })

    // Verify conversation access
    const hasAccess = await this.verifyConversationAccess(conversationId, senderId)
    if (!hasAccess) throw new Error('Unauthorized: No access to conversation')

    // Insert message
    const { data: message, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: validated.content,
        message_type: messageType
      })
      .select(`
        *,
        sender:profiles!sender_id (id, name, avatar_url)
      `)
      .single()

    if (error) throw new Error(`Failed to send message: ${error.message}`)

    // Update conversation last_message_at
    await this.supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return message as MessageWithSender
  }

  private async verifyConversationAccess(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw new Error(`Access verification failed: ${error.message}`)
    return !!data
  }

  private async getUnreadMessageCount(
    conversationId: string,
    userId: string
  ): Promise<number> {
    const { count, error } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('read', false)

    if (error) throw new Error(`Failed to get unread count: ${error.message}`)
    return count || 0
  }

  private async getLastMessage(conversationId: string) {
    const { data } = await this.supabase
      .from('messages')
      .select('content, created_at, sender_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return data
  }
}
```

**packages/services/src/index.ts:**
```typescript
export { MessagingClient } from './messaging/client'
export { ContentModerationService } from './messaging/moderation'
export { PrivacyEventTracker } from './security/privacy-event-tracker'
export { ContactEncryptionService } from './security/contact-encryption'
```

---

### packages/hooks - Shared Hooks with Platform Adapters

**Purpose:** React hooks that work across platforms (with adapters where needed)

**packages/hooks/src/useMessaging.ts:**
```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { MessagingClient } from '@care/services'
import { ConversationWithDetails } from '@care/core/types'

export interface UseMessagingOptions {
  supabase: SupabaseClient
  userId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useMessaging({
  supabase,
  userId,
  autoRefresh = true,
  refreshInterval = 30000
}: UseMessagingOptions) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const clientRef = useRef<MessagingClient>()
  const isMountedRef = useRef(true)

  useEffect(() => {
    clientRef.current = new MessagingClient(supabase)
    return () => {
      isMountedRef.current = false
    }
  }, [supabase])

  const refreshConversations = useCallback(async () => {
    if (!clientRef.current || !isMountedRef.current) return

    try {
      setLoading(true)
      const { conversations: data } = await clientRef.current.getConversations(userId)

      if (isMountedRef.current) {
        setConversations(data)
        const totalUnread = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
        setUnreadCount(totalUnread)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [userId])

  // Initial load
  useEffect(() => {
    refreshConversations()
  }, [refreshConversations])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(refreshConversations, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshConversations])

  const createConversation = useCallback(async (
    recipientId: string,
    helpRequestId?: string,
    initialMessage?: string
  ) => {
    if (!clientRef.current) throw new Error('Client not initialized')

    // Implementation...
    // (This would be extracted from current web implementation)
  }, [])

  return {
    conversations,
    loading,
    error,
    unreadCount,
    refreshConversations,
    createConversation
  }
}
```

**packages/hooks/src/useNetworkStatus.web.ts:**
```typescript
import { useState, useEffect } from 'react'

export interface NetworkStatus {
  isConnected: boolean
  isOnline: boolean
  type?: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Determine connection type (limited on web)
  const type = typeof navigator !== 'undefined' && 'connection' in navigator
    ? ((navigator as any).connection?.effectiveType === '4g' ? 'cellular' : 'wifi')
    : 'unknown'

  return {
    isConnected: isOnline,
    isOnline,
    type
  }
}
```

**packages/hooks/src/useNetworkStatus.native.ts:**
```typescript
import { useState, useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'

export interface NetworkStatus {
  isConnected: boolean
  isOnline: boolean
  type?: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isOnline: true,
    type: 'unknown'
  })

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isOnline: state.isInternetReachable ?? false,
        type: state.type === 'wifi' ? 'wifi' :
              state.type === 'cellular' ? 'cellular' :
              state.type === 'ethernet' ? 'ethernet' : 'unknown'
      })
    })

    return () => unsubscribe()
  }, [])

  return networkStatus
}
```

**packages/hooks/src/index.ts:**
```typescript
export { useMessaging } from './useMessaging'

// Platform-specific exports
export { useNetworkStatus } from './useNetworkStatus'
```

---

## Platform-Specific Implementations

### UI Component Adapters

**packages/ui-primitives/Button/Button.types.ts:**
```typescript
export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onPress?: () => void
  testID?: string
}

export const buttonVariants = {
  primary: {
    backgroundColor: '#BC6547',
    color: '#FFFFFF'
  },
  secondary: {
    backgroundColor: '#7A9E99',
    color: '#FFFFFF'
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#BC6547',
    borderWidth: 1,
    color: '#BC6547'
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#324158'
  }
}

export const buttonSizes = {
  sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14 },
  md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 16 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 }
}
```

**packages/ui-primitives/Button/Button.web.tsx:**
```typescript
import React from 'react'
import { cn } from '@care/core/utils'
import { ButtonProps } from './Button.types'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  testID
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onPress}
      data-testid={testID}
      className={cn(
        'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sage',
        variant === 'primary' && 'bg-primary text-white hover:bg-primary-dark',
        variant === 'secondary' && 'bg-sage text-white hover:bg-sage-dark',
        variant === 'outline' && 'border border-primary text-primary hover:bg-primary/10',
        variant === 'ghost' && 'text-secondary hover:bg-secondary/10',
        size === 'sm' && 'px-3 py-2 text-sm',
        size === 'md' && 'px-4 py-3 text-base',
        size === 'lg' && 'px-6 py-4 text-lg',
        (disabled || loading) && 'opacity-50 cursor-not-allowed'
      )}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}
```

**packages/ui-primitives/Button/Button.native.tsx:**
```typescript
import React from 'react'
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { ButtonProps, buttonVariants, buttonSizes } from './Button.types'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  testID
}: ButtonProps) {
  const variantStyle = buttonVariants[variant]
  const sizeStyle = buttonSizes[size]

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        sizeStyle,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.color} />
      ) : (
        <Text style={[styles.text, { color: variantStyle.color, fontSize: sizeStyle.fontSize }]}>
          {children}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44
  },
  text: {
    fontWeight: '600'
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    opacity: 0.8
  }
})
```

**packages/ui-primitives/Button/index.ts:**
```typescript
export { Button } from './Button'
export type { ButtonProps } from './Button.types'
```

---

## Supabase Integration

### Web Client (apps/web/lib/supabase/client.ts)

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@care/core/types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### Mobile Client (apps/mobile/src/lib/supabase.ts)

```typescript
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@care/core/types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### Authentication Flow (Mobile)

**apps/mobile/src/contexts/AuthContext.tsx:**
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

---

## Navigation Setup

**apps/mobile/src/navigation/RootNavigator.tsx:**
```typescript
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../contexts/AuthContext'

// Screens
import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import RequestsScreen from '../screens/RequestsScreen'
import MessagesScreen from '../screens/MessagesScreen'

const Stack = createNativeStackNavigator()

export function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return null // Or loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Requests" component={RequestsScreen} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="MessageThread" component={MessageThreadScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

---

## Real-time Messaging

**apps/mobile/src/screens/MessageThreadScreen.tsx:**
```typescript
import React, { useState, useEffect } from 'react'
import { View, FlatList, StyleSheet } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { MessagingClient } from '@care/services'
import { MessageWithSender } from '@care/core/types'

export default function MessageThreadScreen() {
  const route = useRoute()
  const { user } = useAuth()
  const { conversationId } = route.params as { conversationId: string }

  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)

  const messagingClient = new MessagingClient(supabase)

  // Load initial messages
  useEffect(() => {
    loadMessages()
  }, [conversationId])

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch full message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`*, sender:profiles!sender_id(id, name, avatar_url)`)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages(prev => [...prev, data as MessageWithSender])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const loadMessages = async () => {
    try {
      const { messages: data } = await messagingClient.getMessages(conversationId, user!.id)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (content: string) => {
    try {
      await messagingClient.sendMessage(conversationId, user!.id, content)
      // Message will appear via real-time subscription
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble message={item} currentUserId={user!.id} />}
        inverted
      />
      <MessageInput onSend={sendMessage} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF2E9'
  }
})
```

---

## Testing Strategy

### Shared Package Tests

**packages/core/src/validations/__tests__/help-request.test.ts:**
```typescript
import { describe, it, expect } from 'vitest'
import { helpRequestSchema } from '../help-request'

describe('helpRequestSchema', () => {
  it('validates correct help request', () => {
    const validRequest = {
      title: 'Need groceries',
      category: 'groceries',
      urgency: 'normal',
      location: 'Springfield, MO',
      locationPrivacy: 'public'
    }

    expect(() => helpRequestSchema.parse(validRequest)).not.toThrow()
  })

  it('rejects short title', () => {
    const invalidRequest = {
      title: 'Help',
      category: 'groceries',
      urgency: 'normal',
      location: 'Springfield, MO',
      locationPrivacy: 'public'
    }

    expect(() => helpRequestSchema.parse(invalidRequest)).toThrow()
  })
})
```

**Run tests across all packages:**
```bash
# From root
npm run test

# Turbo will run tests in all packages in parallel
```

---

## Deployment

### Web Deployment (Vercel)

```bash
# From apps/web
npm run build
npx vercel --prod
```

### Mobile Deployment (EAS Build)

**apps/mobile/eas.json:**
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDEF1234"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

**Build commands:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to app stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## Summary Checklist

### Phase 1: Foundation
- [ ] Monorepo initialized with Turborepo
- [ ] Packages extracted (core, services, hooks)
- [ ] Web app migrated to apps/web
- [ ] All imports updated
- [ ] Tests passing

### Phase 2: Mobile Setup
- [ ] Expo app created in apps/mobile
- [ ] Supabase client configured
- [ ] Auth context implemented
- [ ] Navigation structure created
- [ ] Basic screens scaffolded

### Phase 3: Feature Development
- [ ] Help requests (browse, create, detail)
- [ ] Messaging (conversations, threads, real-time)
- [ ] UI components (15+ primitives)
- [ ] Authentication flow
- [ ] Profile management

### Phase 4: Advanced Features
- [ ] Offline support
- [ ] Push notifications
- [ ] Privacy controls
- [ ] Admin features (optional)

### Phase 5: Launch
- [ ] Testing (80%+ coverage)
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] App store submission

---

**Questions?** Review the full feasibility analysis in `docs/react-native-feasibility-analysis.md`
