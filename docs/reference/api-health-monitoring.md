# API Health & Monitoring

Health check and monitoring endpoints.

**Last Updated**: December 2025

---

## Endpoints

### GET /api/health

Basic health check endpoint.

**Rate Limiting**: Lenient (allowing frequent monitoring)
**Authentication**: Not required

**Success Response** (200):
```json
{
  "status": "healthy",
  "timestamp": "2025-12-30T12:00:00.000Z",
  "service": "care-collective-preview",
  "version": "1.0.0-preview",
  "uptime": 86400000,
  "checks": {
    "database": {
      "status": "healthy",
      "response_time_ms": 50,
      "message": "Database responsive",
      "last_checked": "2025-12-30T12:00:00.000Z"
    },
    "memory": {
      "status": "healthy",
      "message": "Memory usage normal",
      "last_checked": "2025-12-30T12:00:00.000Z"
    },
    "environment": {
      "status": "healthy",
      "message": "All required environment variables present",
      "last_checked": "2025-12-30T12:00:00.000Z"
    }
  },
  "metadata": {
    "node_version": "v20.0.0",
    "platform": "linux",
    "memory_usage": {
      "heapUsed": 123456789,
      "heapTotal": 2000000000
    }
  }
}
```

**HTTP Status Codes**:
- `200` - Healthy or Degraded
- `503` - Unhealthy

**Health Check Thresholds**:
- **Database**: `healthy` if response time < 1000ms, `degraded` otherwise
- **Memory**: `healthy` if < 75% used, `degraded` if 75-90%, `unhealthy` if > 90%
- **Environment**: Checks for required environment variables

---

### GET /api/health/deep

Deep health check with extended diagnostics.

**Authentication**: Not required

**Success Response** (200):
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "connection_pool": "healthy",
      "query_performance": "good",
      "replication_lag": 0
    },
    "memory": {
      "status": "healthy",
      "heap_usage_percent": 62,
      "rss_mb": 256,
      "external_mb": 128
    },
    "environment": {
      "status": "healthy",
      "required_vars": ["present"],
      "optional_vars": ["configured"]
    },
    "external_services": {
      "supabase": "healthy",
      "storage": "healthy"
    },
    "cache": {
      "status": "healthy",
      "hit_rate": 0.95
    }
  }
}
```

---

### GET /api/health/live

Liveness probe for container orchestration.

**Authentication**: Not required

**Success Response** (200):
```json
{
  "alive": true,
  "timestamp": "2025-12-30T12:00:00.000Z"
}
```

**Purpose**: Indicates if service is running (Kubernetes/Docker probe)

---

### GET /api/health/ready

Readiness probe for container orchestration.

**Authentication**: Not required

**Success Response** (200):
```json
{
  "ready": true,
  "timestamp": "2025-12-30T12:00:00.000Z",
  "dependencies": {
    "database": true,
    "cache": true,
    "storage": true
  }
}
```

**Error Response** (503):
```json
{
  "ready": false,
  "reason": "Database connection failed",
  "dependencies": {
    "database": false,
    "cache": true,
    "storage": true
  }
}
```

**Purpose**: Indicates if service is ready to accept requests (all dependencies healthy)

---

## Health Status Values

| Status | Description | HTTP Code |
|--------|-------------|-------------|
| `healthy` | All checks passed | 200 |
| `degraded` | Some checks warning | 200 |
| `unhealthy` | Critical failure | 503 |

---

## Monitoring Use Cases

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### Monitoring Service (Prometheus)

```bash
# Check every 30 seconds
curl -s https://api.carecollective.com/api/health | jq '.status'
```

### Docker Healthcheck

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

---

## See Also

- [API Overview](./api-overview.md) - General reference
- [Deployment Documentation](../deployment/) - Production deployment

---

**Last Updated**: December 2025
