import { describe, it, expect } from 'vitest'
import { createTestApp } from '../../src/test-utils/app-factory.js'

describe('Root Route Integration Tests', () => {
  const app = createTestApp()

  describe('GET /', () => {
    it('should return API information', async () => {
      const res = await app.request('/')
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('message', 'Hono + Effect-TS API')
      expect(data).toHaveProperty('version', '1.0.0')
      expect(data).toHaveProperty('endpoints')
      
      const endpoints = data.endpoints
      expect(endpoints).toHaveProperty('health', '/health')
      expect(endpoints).toHaveProperty('users', '/api/users')
      expect(endpoints).toHaveProperty('docs')
    })

    it('should return correct content type', async () => {
      const res = await app.request('/')
      
      expect(res.headers.get('content-type')).toContain('application/json')
    })

    it('should include security headers', async () => {
      const res = await app.request('/')
      
      // Check for secure headers middleware
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
      expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
      expect(res.headers.get('x-xss-protection')).toBe('0')
    })

    it('should include timing header', async () => {
      const res = await app.request('/')
      
      // Check for timing middleware header
      expect(res.headers.has('server-timing')).toBe(true)
    })

    it('should include CORS headers for OPTIONS request', async () => {
      const res = await app.request('/', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET'
        }
      })
      
      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
      expect(res.headers.get('access-control-allow-methods')).toContain('GET')
      expect(res.headers.get('access-control-allow-credentials')).toBe('true')
    })
  })
})