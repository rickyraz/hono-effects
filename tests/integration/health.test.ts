import { describe, it, expect } from 'vitest'
import { createTestApp } from '../../src/test-utils/app-factory.js'

describe('Health Routes Integration Tests', () => {
  const app = createTestApp()

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await app.request('/health')
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('status', 'healthy')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('uptime')
      expect(data).toHaveProperty('version', '1.0.0')
      expect(typeof data.uptime).toBe('number')
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })

    it('should return valid timestamp format', async () => {
      const res = await app.request('/health')
      const data = await res.json()
      
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const res = await app.request('/health/ready')
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('status', 'ready')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('services')
      
      expect(data.services).toHaveProperty('database', 'healthy')
      expect(data.services).toHaveProperty('validation', 'healthy')
      expect(data.services).toHaveProperty('logger', 'healthy')
    })

    it('should return valid services health status', async () => {
      const res = await app.request('/health/ready')
      const data = await res.json()
      
      const services = data.services
      Object.values(services).forEach(status => {
        expect(status).toBe('healthy')
      })
    })
  })
})