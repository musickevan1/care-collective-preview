/**
 * @fileoverview Test Mock Factory
 * 
 * Addresses Issue #11 from TESTING_ISSUES_AND_FIXES.md - Test Mock Setup Complexity
 * Provides reusable mock factories to reduce boilerplate in test setup
 */

import { vi, type Mock } from 'vitest'

// Type definitions for mocks
interface MockSupabaseClient {
  auth: {
    getUser: Mock
    getSession: Mock
    signInWithPassword: Mock
    signUp: Mock
    signOut: Mock
    refreshSession: Mock
    onAuthStateChange: Mock
  }
  from: Mock
}

interface MockRouterOptions {
  pathname?: string
  searchParams?: Record<string, string>
  push?: Mock
  replace?: Mock
  back?: Mock
  forward?: Mock
  refresh?: Mock
  prefetch?: Mock
}

interface MockUserData {
  id?: string
  email?: string
  name?: string
  location?: string
  created_at?: string
}

interface MockHelpRequestData {
  id?: string
  title?: string
  description?: string
  category?: 'groceries' | 'transport' | 'household' | 'medical' | 'other'
  urgency?: 'normal' | 'urgent' | 'critical'
  status?: 'open' | 'closed' | 'in_progress'
  user_id?: string
  created_at?: string
  profiles?: MockUserData
}

interface MockContactExchangeData {
  id?: string
  request_id?: string
  helper_id?: string
  requester_id?: string
  message?: string
  consent_given?: boolean
  status?: 'initiated' | 'completed' | 'failed'
  created_at?: string
}

/**
 * Factory for creating Supabase client mocks
 */
export class MockFactory {
  /**
   * Create a comprehensive Supabase client mock
   */
  static createSupabaseMock(overrides?: Partial<MockSupabaseClient>): MockSupabaseClient {
    const defaultMock: MockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: MockFactory.createMockUser() },
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: MockFactory.createMockSession() },
          error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: MockFactory.createMockUser(), session: MockFactory.createMockSession() },
          error: null,
        }),
        signUp: vi.fn().mockResolvedValue({
          data: { user: MockFactory.createMockUser(), session: MockFactory.createMockSession() },
          error: null,
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        refreshSession: vi.fn().mockResolvedValue({
          data: { user: MockFactory.createMockUser(), session: MockFactory.createMockSession() },
          error: null,
        }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
      from: vi.fn((table: string) => MockFactory.createQueryBuilderMock(table)),
    }
    
    // Apply overrides
    if (overrides) {
      Object.assign(defaultMock.auth, overrides.auth)
      if (overrides.from) {
        defaultMock.from = overrides.from
      }
    }
    
    return defaultMock
  }
  
  /**
   * Create a query builder mock for Supabase operations
   */
  static createQueryBuilderMock(table: string) {
    const mockData = MockFactory.getMockDataForTable(table)
    
    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      and: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: Array.isArray(mockData) ? mockData[0] : mockData,
        error: null,
      }),
      then: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    }
  }
  
  /**
   * Get default mock data for different tables
   */
  static getMockDataForTable(table: string) {
    switch (table) {
      case 'help_requests':
        return [MockFactory.createMockHelpRequest()]
      case 'profiles':
        return [MockFactory.createMockUser()]
      case 'contact_exchanges':
        return [MockFactory.createMockContactExchange()]
      default:
        return []
    }
  }
  
  /**
   * Create a Next.js router mock
   */
  static createRouterMock(options: MockRouterOptions = {}): any {
    return {
      push: options.push || vi.fn(),
      replace: options.replace || vi.fn(),
      back: options.back || vi.fn(),
      forward: options.forward || vi.fn(),
      refresh: options.refresh || vi.fn(),
      prefetch: options.prefetch || vi.fn(),
      pathname: options.pathname || '/',
      searchParams: new URLSearchParams(options.searchParams || {}),
    }
  }
  
  /**
   * Create mock user data
   */
  static createMockUser(overrides: MockUserData = {}): any {
    return {
      id: overrides.id || 'user-123',
      email: overrides.email || 'test@example.com',
      name: overrides.name || 'Test User',
      location: overrides.location || 'Test City, MO',
      created_at: overrides.created_at || '2024-01-01T00:00:00Z',
      ...overrides,
    }
  }
  
  /**
   * Create mock session data
   */
  static createMockSession(overrides: any = {}): any {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
    
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: expiresAt,
      user: MockFactory.createMockUser(),
      ...overrides,
    }
  }
  
  /**
   * Create mock help request data
   */
  static createMockHelpRequest(overrides: MockHelpRequestData = {}): any {
    return {
      id: overrides.id || 'request-123',
      title: overrides.title || 'Need groceries picked up',
      description: overrides.description || 'Weekly shopping assistance needed',
      category: overrides.category || 'groceries',
      urgency: overrides.urgency || 'normal',
      status: overrides.status || 'open',
      user_id: overrides.user_id || 'user-456',
      created_at: overrides.created_at || '2024-01-01T00:00:00Z',
      profiles: overrides.profiles || MockFactory.createMockUser({ id: 'user-456' }),
      ...overrides,
    }
  }
  
  /**
   * Create mock contact exchange data
   */
  static createMockContactExchange(overrides: MockContactExchangeData = {}): any {
    return {
      id: overrides.id || 'exchange-123',
      request_id: overrides.request_id || 'request-123',
      helper_id: overrides.helper_id || 'user-789',
      requester_id: overrides.requester_id || 'user-456',
      message: overrides.message || 'I can help with this request',
      consent_given: overrides.consent_given ?? true,
      status: overrides.status || 'initiated',
      created_at: overrides.created_at || '2024-01-01T00:00:00Z',
      ...overrides,
    }
  }
  
  /**
   * Create mock window object for browser APIs
   */
  static createMockWindow(overrides: Partial<Window> = {}): Partial<Window> {
    return {
      location: {
        href: 'http://localhost:3000',
        pathname: '/',
        search: '',
        origin: 'http://localhost:3000',
        ...overrides.location,
      } as Location,
      navigator: {
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ...overrides.navigator,
      } as Navigator,
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        ...overrides.localStorage,
      } as unknown as Storage,
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        ...overrides.sessionStorage,
      } as unknown as Storage,
      ...overrides,
    }
  }
  
  /**
   * Create mock authentication context
   */
  static createMockAuthContext(user?: MockUserData, session?: any) {
    return {
      user: user ? MockFactory.createMockUser(user) : null,
      session: session || MockFactory.createMockSession(),
      loading: false,
      error: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    }
  }
  
  /**
   * Create mock form data for testing forms
   */
  static createMockFormData(data: Record<string, string> = {}): FormData {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value)
    })
    return formData
  }
  
  /**
   * Create mock file for testing file uploads
   */
  static createMockFile(
    name = 'test.txt',
    content = 'test content',
    type = 'text/plain'
  ): File {
    const blob = new Blob([content], { type })
    return new File([blob], name, { type })
  }
  
  /**
   * Create mock fetch response
   */
  static createMockFetchResponse(data: any, options: {
    status?: number
    statusText?: string
    headers?: Record<string, string>
  } = {}) {
    return {
      ok: (options.status || 200) >= 200 && (options.status || 200) < 300,
      status: options.status || 200,
      statusText: options.statusText || 'OK',
      headers: new Headers(options.headers || {}),
      json: vi.fn().mockResolvedValue(data),
      text: vi.fn().mockResolvedValue(JSON.stringify(data)),
      blob: vi.fn().mockResolvedValue(new Blob([JSON.stringify(data)])),
    }
  }
}

/**
 * Test utility functions
 */
export class TestUtils {
  /**
   * Wait for a specified amount of time (for async operations)
   */
  static async wait(ms: number = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * Wait for the next tick
   */
  static async nextTick(): Promise<void> {
    return new Promise(resolve => process.nextTick(resolve))
  }
  
  /**
   * Create a promise that resolves after a delay
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * Generate a random ID for testing
   */
  static generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }
  
  /**
   * Generate a random email for testing
   */
  static generateEmail(domain = 'example.com'): string {
    return `test-${TestUtils.generateId()}@${domain}`
  }
  
  /**
   * Create a mock console for capturing console output
   */
  static createMockConsole() {
    return {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    }
  }
  
  /**
   * Mock global Date for deterministic testing
   */
  static mockDate(date: string | Date = '2024-01-01T00:00:00Z') {
    const mockDate = new Date(date)
    vi.setSystemTime(mockDate)
    return mockDate
  }
  
  /**
   * Restore real Date after mocking
   */
  static restoreDate() {
    vi.useRealTimers()
  }
}

/**
 * Preset test scenarios for common testing patterns
 */
export class TestScenarios {
  /**
   * Authenticated user scenario
   */
  static authenticatedUser(userData?: MockUserData) {
    const user = MockFactory.createMockUser(userData)
    const session = MockFactory.createMockSession({ user })
    
    return {
      supabase: MockFactory.createSupabaseMock({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
          getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
          signInWithPassword: vi.fn(),
          signUp: vi.fn(),
          signOut: vi.fn(),
          refreshSession: vi.fn(),
          onAuthStateChange: vi.fn().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
          }),
        },
      }),
      user,
      session,
    }
  }
  
  /**
   * Unauthenticated user scenario
   */
  static unauthenticatedUser() {
    return {
      supabase: MockFactory.createSupabaseMock({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          signInWithPassword: vi.fn(),
          signUp: vi.fn(),
          signOut: vi.fn(),
          refreshSession: vi.fn(),
          onAuthStateChange: vi.fn().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
          }),
        },
      }),
      user: null,
      session: null,
    }
  }
  
  /**
   * Database error scenario
   */
  static databaseError(errorMessage = 'Database connection failed') {
    return MockFactory.createSupabaseMock({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: errorMessage, code: 'DATABASE_ERROR' },
        }),
        then: vi.fn().mockResolvedValue({
          data: null,
          error: { message: errorMessage, code: 'DATABASE_ERROR' },
        }),
      })),
    })
  }
  
  /**
   * Network error scenario
   */
  static networkError() {
    return MockFactory.createSupabaseMock({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Network error')),
        then: vi.fn().mockRejectedValue(new Error('Network error')),
      })),
    })
  }
}

// Export commonly used mock instances
export const mockUser = MockFactory.createMockUser()
export const mockSession = MockFactory.createMockSession()
export const mockHelpRequest = MockFactory.createMockHelpRequest()
export const mockContactExchange = MockFactory.createMockContactExchange()
export const mockSupabase = MockFactory.createSupabaseMock()
export const mockRouter = MockFactory.createRouterMock()