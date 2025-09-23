# Care Collective Error Handling & Monitoring System

This document outlines the comprehensive error handling and monitoring system implemented for the Care Collective project, designed with community care principles and production readiness in mind.

## 🌟 Key Features

- **Community-Focused Messaging**: Error messages prioritize user wellbeing and support
- **Comprehensive Error Tracking**: Automatic error capture with detailed context
- **Structured Logging**: Multi-level logging with proper categorization
- **Production Monitoring**: Health checks, performance metrics, and alerting
- **Graceful Degradation**: Thoughtful error boundaries and fallback states
- **Accessibility**: Error states that work with screen readers and assistive technologies

## 📁 System Architecture

### Core Components

```
lib/
├── logger.ts                    # Structured logging system
├── error-tracking.ts           # Error tracking and monitoring
├── api-error.ts               # Standardized API error handling
├── supabase-error-handler.ts  # Database error handling
└── error-setup.ts            # System initialization

components/
├── ErrorBoundary.tsx          # React error boundaries
├── PageErrorBoundary.tsx      # Page-level error handling
├── ErrorState.tsx             # User-friendly error components
├── SafeFormWrapper.tsx        # Form error handling
└── SafeAsyncComponent.tsx     # Async operation error handling

hooks/
└── useErrorHandler.ts         # Error handling hooks

app/
├── error.tsx                  # Global error page
├── not-found.tsx             # 404 page
└── api/health/               # Health check endpoints
    ├── route.ts              # Basic health check
    ├── deep/route.ts         # Comprehensive health check
    ├── ready/route.ts        # Kubernetes readiness probe
    └── live/route.ts         # Kubernetes liveness probe
```

## 🚀 Getting Started

### Automatic Setup

The error handling system is automatically initialized when the app starts. No additional setup required!

### Manual Testing (Development Only)

```typescript
import { testErrorHandling } from '@/lib/error-setup'

// In development console
testErrorHandling()
```

## 🛠 Usage Examples

### 1. Form Error Handling

```tsx
import { SafeFormWrapper, SafeFormField } from '@/components/SafeFormWrapper'

function MyForm() {
  const handleSubmit = async (formData: FormData) => {
    // Your form submission logic
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Submission failed')
    }
  }

  return (
    <SafeFormWrapper 
      onSubmit={handleSubmit}
      formName="contact-form"
    >
      <SafeFormField name="email" label="Email" required>
        <input type="email" name="email" required />
      </SafeFormField>
      
      <button type="submit">Submit</button>
    </SafeFormWrapper>
  )
}
```

### 2. Async Data Loading

```tsx
import { SafeAsyncComponent } from '@/components/SafeAsyncComponent'

function UserProfile({ userId }: { userId: string }) {
  const fetchUser = async () => {
    const response = await fetch(`/api/users/${userId}`)
    if (!response.ok) throw new Error('Failed to load user')
    return response.json()
  }

  return (
    <SafeAsyncComponent
      asyncOperation={fetchUser}
      componentName="UserProfile"
      dependencies={[userId]}
    >
      {(user) => (
        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      )}
    </SafeAsyncComponent>
  )
}
```

### 3. Custom Error Handling

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { ErrorState } from '@/components/ErrorState'

function MyComponent() {
  const { isError, error, handleError, clearError } = useErrorHandler({
    component: 'MyComponent'
  })

  const risky Operation = () => {
    try {
      // Some risky operation
      doSomethingRisky()
    } catch (err) {
      handleError(err as Error)
    }
  }

  if (isError) {
    return <ErrorState error={error} onRetry={clearError} />
  }

  return <div>Component content</div>
}
```

### 4. API Error Handling

```tsx
import { createErrorResponse, createSuccessResponse, throwError } from '@/lib/api-error'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.email) {
      throwError.validation('Email is required', 'email')
    }
    
    // Your logic here
    const result = await processData(data)
    
    return createSuccessResponse(result, 'Successfully processed')
    
  } catch (error) {
    return createErrorResponse(error as Error)
  }
}
```

### 5. Database Operations

```tsx
import { dbQuery } from '@/lib/supabase-error-handler'
import { createClient } from '@/lib/supabase/server'

async function getUserProfile(userId: string) {
  const supabase = await createClient()
  
  // Automatic error handling with meaningful error messages
  const profile = await dbQuery.select(
    () => supabase.from('profiles').select('*').eq('id', userId).single(),
    'profiles'
  )
  
  return profile
}
```

## 📊 Health Monitoring

### Health Check Endpoints

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `/api/health` | Basic health check | Load balancer health checks |
| `/api/health/deep` | Comprehensive checks | Monitoring dashboard |
| `/api/health/ready` | Kubernetes readiness | Container orchestration |
| `/api/health/live` | Kubernetes liveness | Container orchestration |

### Example Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "care-collective-preview",
  "version": "1.0.0-preview",
  "uptime": 3600000,
  "checks": {
    "database": {
      "status": "healthy",
      "response_time_ms": 45,
      "message": "Database responsive"
    },
    "memory": {
      "status": "healthy",
      "message": "Memory usage normal"
    },
    "environment": {
      "status": "healthy",
      "message": "All required environment variables present"
    }
  }
}
```

## 🎯 Error Message Philosophy

Our error messages follow community care principles:

### ✅ Good Examples
- "We're having a moment" (instead of "System Error")
- "Something unexpected happened, but it's not your fault"
- "Our community is here to support you"
- "Your wellbeing is our priority"

### ❌ Avoid
- Technical jargon that intimidates users
- Blame-focused language ("You did something wrong")
- Cold, corporate messaging
- Messages that might increase anxiety for users in crisis

## 🔧 Configuration

### Environment Variables

```bash
# Optional: External error tracking endpoint
NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT=https://your-error-service.com/api/errors

# Required: Supabase configuration (for health checks)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Logging Levels

- **Development**: All levels (debug, info, warn, error)
- **Production**: warn and error only
- **Client-side**: Stored in localStorage (last 100 entries)
- **Server-side**: Console output with structured format

## 🚨 Production Considerations

### Error Tracking Integration

To integrate with external error tracking services (Sentry, LogRocket, etc.):

1. Set the `NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT` environment variable
2. The system will automatically send error events to your endpoint
3. Error events include full context, user information, and breadcrumbs

### Performance Monitoring

The system automatically tracks:
- Page load times
- API response times
- Long tasks (>50ms)
- Database query performance
- Memory usage

### Security Notes

- Stack traces are only shown in development
- User information is anonymized in error reports
- Sensitive data is never logged
- Error IDs can be used to correlate logs without exposing user data

## 🧪 Testing Error Handling

### Manual Testing

1. **Form Errors**: Submit invalid forms to test validation
2. **Network Errors**: Use browser dev tools to simulate network failures
3. **API Errors**: Test with invalid API endpoints
4. **JavaScript Errors**: Trigger errors in components to test boundaries

### Health Check Testing

```bash
# Basic health check
curl http://localhost:3000/api/health

# Deep health check
curl http://localhost:3000/api/health/deep

# Readiness check
curl http://localhost:3000/api/health/ready

# Liveness check
curl http://localhost:3000/api/health/live
```

## 🤝 Contributing

When adding new features:

1. **Wrap risky operations** in error boundaries or error handlers
2. **Use meaningful error messages** that align with our community values
3. **Test error states** as thoroughly as success states
4. **Consider accessibility** in error state designs
5. **Log appropriately** with relevant context

## 📋 Troubleshooting

### Common Issues

**Issue**: Error boundary not catching errors
**Solution**: Ensure you're using the ErrorBoundary component and errors are thrown during render

**Issue**: Health checks failing
**Solution**: Check database connectivity and environment variables

**Issue**: Error tracking not working
**Solution**: Verify error tracking endpoint and network connectivity

### Debug Mode

Enable debug logging in development:

```typescript
import { logger } from '@/lib/logger'

logger.debug('Debug message', { context: 'debugging' })
```

## 🔮 Future Enhancements

- Integration with external monitoring services (Datadog, New Relic)
- Advanced performance monitoring with Core Web Vitals
- Custom error reporting dashboard
- Automated error categorization and prioritization
- Integration with community support workflows

## 📞 Support

For questions about the error handling system:

1. Check this documentation
2. Review component examples in the codebase
3. Test with the provided utility functions
4. Reach out to the development team

Remember: Our error handling system is designed to support our community with empathy and care, especially during difficult moments. Always prioritize user wellbeing in error scenarios.