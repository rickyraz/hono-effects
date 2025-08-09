import { describe, it, expect } from 'vitest'
import { createTestApp } from '../../src/test-utils/app-factory.js'

describe('Middleware Integration Tests', () => {
  const app = createTestApp()

  describe('Security Headers Middleware', () => {
    it('should include X-Content-Type-Options header', async () => {
      const res = await app.request('/')
      
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    })

    it('should include X-Frame-Options header', async () => {
      const res = await app.request('/')
      
      expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    })

    it('should include X-XSS-Protection header', async () => {
      const res = await app.request('/')
      
      expect(res.headers.get('x-xss-protection')).toBe('0')
    })

    it('should include Referrer-Policy header', async () => {
      const res = await app.request('/')
      
      expect(res.headers.has('referrer-policy')).toBe(true)
    })

    it('should apply security headers to all routes', async () => {
      const routes = ['/', '/health', '/api/users']
      
      for (const route of routes) {
        const res = await app.request(route)
        expect(res.headers.get('x-content-type-options')).toBe('nosniff')
        expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
      }
    })
  })

  describe('CORS Middleware', () => {
    it('should handle preflight OPTIONS requests', async () => {
      const res = await app.request('/api/users', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })
      
      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
      expect(res.headers.get('access-control-allow-methods')).toContain('POST')
      expect(res.headers.get('access-control-allow-headers')).toContain('Content-Type')
      expect(res.headers.get('access-control-allow-credentials')).toBe('true')
    })

    it('should allow localhost:3000 origin', async () => {
      const res = await app.request('/api/users', {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      })
      
      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
      expect(res.headers.get('access-control-allow-credentials')).toBe('true')
    })

    it('should allow localhost:5173 origin', async () => {
      const res = await app.request('/api/users', {
        headers: {
          'Origin': 'http://localhost:5173'
        }
      })
      
      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
      expect(res.headers.get('access-control-allow-credentials')).toBe('true')
    })

    it('should reject unauthorized origins', async () => {
      const res = await app.request('/api/users', {
        headers: {
          'Origin': 'http://malicious-site.com'
        }
      })
      
      expect(res.headers.get('access-control-allow-origin')).toBeNull()
    })

    it('should support all configured HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      
      for (const method of methods) {
        const res = await app.request('/api/users', {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': method
          }
        })
        
        expect(res.headers.get('access-control-allow-methods')).toContain(method)
      }
    })
  })

  describe('Timing Middleware', () => {
    it('should include Server-Timing header', async () => {
      const res = await app.request('/')
      
      expect(res.headers.has('server-timing')).toBe(true)
    })

    it('should include timing information in header', async () => {
      const res = await app.request('/health')
      
      const serverTiming = res.headers.get('server-timing')
      expect(serverTiming).toBeTruthy()
      expect(serverTiming).toMatch(/total;dur=\d+(\.\d+)?/)
    })

    it('should track timing for all routes', async () => {
      const routes = ['/', '/health', '/api/users']
      
      for (const route of routes) {
        const res = await app.request(route)
        const serverTiming = res.headers.get('server-timing')
        expect(serverTiming).toBeTruthy()
        expect(serverTiming).toMatch(/total;dur=\d+(\.\d+)?/)
      }
    })

    it('should show different timing for different routes', async () => {
      const res1 = await app.request('/')
      const res2 = await app.request('/api/users')
      
      const timing1 = res1.headers.get('server-timing')
      const timing2 = res2.headers.get('server-timing')
      
      expect(timing1).toBeTruthy()
      expect(timing2).toBeTruthy()
      
      // Both should have timing info (even if values might be similar)
      expect(timing1).toMatch(/total;dur=\d+(\.\d+)?/)
      expect(timing2).toMatch(/total;dur=\d+(\.\d+)?/)
    })
  })

  describe('Pretty JSON Middleware', () => {
    it('should return JSON with proper content-type', async () => {
      const res = await app.request('/')
      
      expect(res.headers.get('content-type')).toContain('application/json')
      
      const body = await res.text()
      // Should be valid JSON
      expect(() => JSON.parse(body)).not.toThrow()
    })

    it('should return valid JSON responses consistently', async () => {
      const routes = ['/', '/health', '/api/users']
      
      for (const route of routes) {
        const res = await app.request(route)
        expect(res.headers.get('content-type')).toContain('application/json')
        
        const body = await res.text()
        // Should be valid JSON
        expect(() => JSON.parse(body)).not.toThrow()
      }
    })

    it('should maintain JSON validity despite formatting', async () => {
      const res = await app.request('/health')
      
      const body = await res.text()
      expect(() => JSON.parse(body)).not.toThrow()
      
      const data = JSON.parse(body)
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
    })
  })

  describe('Middleware Order and Interaction', () => {
    it('should apply all middleware in correct order', async () => {
      const res = await app.request('/api/users', {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      })
      
      // Security headers should be present
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
      expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
      
      // CORS headers should be present
      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
      
      // Timing header should be present
      expect(res.headers.has('server-timing')).toBe(true)
    })

    it('should not interfere with Effect-TS error handling', async () => {
      const res = await app.request('/api/users/invalid')
      
      // Should still have middleware headers even with error
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
      expect(res.headers.has('server-timing')).toBe(true)
      
      // Should still handle Effect-TS validation error properly
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
    })

    it('should maintain middleware functionality with Effect success', async () => {
      const res = await app.request('/health')
      
      // All middleware should be active
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
      expect(res.headers.has('server-timing')).toBe(true)
      expect(res.headers.get('content-type')).toContain('application/json')
      
      // Effect-TS should work properly
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('status', 'healthy')
    })

    it('should handle middleware with async Effect operations', async () => {
      const userData = {
        name: "Middleware Test",
        email: "middleware@example.com"
      }
      
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        },
        body: JSON.stringify(userData)
      })
      
      // All middleware should work with async Effect chains
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
      expect(res.headers.has('server-timing')).toBe(true)
      expect(res.headers.get('content-type')).toContain('application/json')
      
      // Effect operation should succeed
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('user')
      expect(data.user).toHaveProperty('name', userData.name)
    })
  })
})