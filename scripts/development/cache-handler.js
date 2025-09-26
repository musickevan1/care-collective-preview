/**
 * Next.js Custom Cache Handler for Performance Optimization
 * Provides efficient caching for builds and reduces compilation time
 */

const fs = require('fs/promises')
const path = require('path')

class CacheHandler {
  constructor() {
    this.cacheDir = path.join(process.cwd(), '.next/cache/custom')
    this.ensureCacheDir()
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  async get(key) {
    try {
      const filePath = path.join(this.cacheDir, `${key}.json`)
      const data = await fs.readFile(filePath, 'utf8')
      const cached = JSON.parse(data)
      
      // Check if cache is still valid (24 hours)
      if (Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) {
        await this.delete(key)
        return null
      }
      
      return cached.value
    } catch (error) {
      return null
    }
  }

  async set(key, value, maxAge) {
    try {
      const filePath = path.join(this.cacheDir, `${key}.json`)
      const cached = {
        value,
        timestamp: Date.now(),
        maxAge
      }
      await fs.writeFile(filePath, JSON.stringify(cached))
    } catch (error) {
      console.warn('Cache write failed:', error)
    }
  }

  async delete(key) {
    try {
      const filePath = path.join(this.cacheDir, `${key}.json`)
      await fs.unlink(filePath)
    } catch (error) {
      // File might not exist
    }
  }
}

module.exports = CacheHandler