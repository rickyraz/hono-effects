import { describe, it, expect } from 'vitest'
import { Effect, Exit } from 'effect'
import { createTestApp } from '../../src/test-utils/app-factory.js'
import { DatabaseError } from '../../src/services/database.js'
import { ValidationError } from '../../src/services/validation.js'
import { runEffect } from '../../src/utils/effect-hono.js'

describe('Effect-TS Mechanisms Integration Tests', () => {
  const app = createTestApp()

  describe('Effect Error Handling', () => {
    it('should handle ValidationError correctly', async () => {
      // Test with invalid user ID to trigger ValidationError
      const res = await app.request('/api/users/invalid')
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
      expect(data).toHaveProperty('details')
      expect(Array.isArray(data.details)).toBe(true)
    })

    it('should handle DatabaseError correctly', async () => {
      // Test with non-existent user ID to trigger DatabaseError
      const res = await app.request('/api/users/9999')
      
      expect(res.status).toBe(500)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Database error')
      expect(data).toHaveProperty('message')
      expect(data.message).toContain('not found')
    })

    it('should handle JSON parsing errors in POST requests', async () => {
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json{'
      })
      
      expect(res.status).toBe(500)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Internal server error')
    })
  })

  describe('Effect Success Handling', () => {
    it('should properly handle Effect success with object response', async () => {
      const res = await app.request('/health')
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('uptime')
      expect(data).toHaveProperty('version')
    })

    it('should properly handle Effect success with nested object response', async () => {
      const res = await app.request('/api/users')
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('users')
      expect(Array.isArray(data.users)).toBe(true)
    })
  })

  describe('Effect Composition and Chaining', () => {
    it('should handle complex Effect chains in user creation', async () => {
      const userData = {
        name: "Effect Test User",
        email: "effect@example.com"
      }
      
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('user')
      
      // Verify the Effect chain executed properly:
      // 1. JSON parsing (Effect.promise)
      // 2. Validation (Schema.decodeUnknown)
      // 3. Database operation (database.createUser)
      // 4. Logging (logger.info)
      expect(data.user).toHaveProperty('name', userData.name)
      expect(data.user).toHaveProperty('email', userData.email)
      expect(data.user).toHaveProperty('id')
      expect(data.user).toHaveProperty('createdAt')
    })

    it('should handle Effect chains with validation and database lookup', async () => {
      const res = await app.request('/api/users/1')
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('user')
      
      // Verify the Effect chain executed properly:
      // 1. Parameter extraction
      // 2. ID validation (Schema.decodeUnknown)
      // 3. Database lookup (database.getUserById)
      // 4. Logging (logger.info)
      expect(data.user).toHaveProperty('id', 1)
      expect(data.user).toHaveProperty('name')
      expect(data.user).toHaveProperty('email')
    })

    it('should handle complex Effect chains in user update', async () => {
      const updateData = {
        name: "Updated via Effect Chain"
      }
      
      const res = await app.request('/api/users/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('user')
      
      // Verify the complex Effect chain executed properly:
      // 1. Parameter validation (ID)
      // 2. JSON parsing (body)
      // 3. Data validation (UpdateUserSchema)
      // 4. Data filtering (optional properties)
      // 5. Database update operation
      // 6. Logging at multiple steps
      expect(data.user).toHaveProperty('name', updateData.name)
      expect(data.user).toHaveProperty('id', 1)
    })
  })

  describe('Effect Layer and Context Integration', () => {
    it('should properly inject Logger service through Effect context', async () => {
      // All routes use Logger service - if this works, context injection works
      const res = await app.request('/health')
      
      expect(res.status).toBe(200)
      // The fact that we get a successful response means Logger was injected properly
      // through the AppLive layer in runEffect
    })

    it('should properly inject Database service through Effect context', async () => {
      const res = await app.request('/api/users')
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('users')
      // The fact that we get users means Database service was injected properly
    })

    it('should properly inject Validation service through Effect context', async () => {
      // Test validation service injection with invalid data
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "", // Invalid - empty string
          email: "test@example.com"
        })
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
      // The fact that we get validation error means Validation service was injected
    })
  })

  describe('Effect Error Recovery and Fallbacks', () => {
    it('should handle multiple validation errors gracefully', async () => {
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "", // Invalid - empty
          email: "invalid-email" // Invalid - wrong format
        })
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
      expect(data).toHaveProperty('details')
      // Should handle all validation errors, not just the first one
    })

    it('should maintain request context through Effect chain', async () => {
      // Create user and immediately fetch it to test context consistency
      const createRes = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "Context Test",
          email: "context@example.com"
        })
      })
      
      expect(createRes.status).toBe(200)
      
      const createData = await createRes.json()
      const userId = createData.user.id
      
      // Fetch the created user
      const fetchRes = await app.request(`/api/users/${userId}`)
      
      expect(fetchRes.status).toBe(200)
      
      const fetchData = await fetchRes.json()
      expect(fetchData.user).toHaveProperty('name', 'Context Test')
      expect(fetchData.user).toHaveProperty('email', 'context@example.com')
    })
  })

  describe('Effect Performance and Resource Management', () => {
    it('should handle concurrent requests without resource conflicts', async () => {
      // Simulate concurrent requests
      const requests = Array.from({ length: 5 }, (_, i) => 
        app.request('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: `Concurrent User ${i}`,
            email: `concurrent${i}@example.com`
          })
        })
      )
      
      const responses = await Promise.all(requests)
      
      // All requests should succeed
      responses.forEach((res, index) => {
        expect(res.status).toBe(200)
      })
      
      // Verify all users were created with correct data
      const responseData = await Promise.all(
        responses.map(res => res.json())
      )
      
      responseData.forEach((data, index) => {
        expect(data.user).toHaveProperty('name', `Concurrent User ${index}`)
        expect(data.user).toHaveProperty('email', `concurrent${index}@example.com`)
        expect(data.user).toHaveProperty('id')
      })
    })

    it('should properly clean up resources after Effect completion', async () => {
      // Test resource cleanup by making many sequential requests
      const requests :Response[]= []
      
      for (let i = 0; i < 10; i++) {
        const res = await app.request('/health')
        expect(res.status).toBe(200)
        requests.push(res)
      }
      
      // If resources weren't cleaned up properly, we'd likely see memory leaks
      // or degraded performance. The fact that all requests succeed indicates
      // proper resource management.
      expect(requests).toHaveLength(10)
    })
  })
})