import { describe, it, expect, beforeEach } from 'vitest'
import { createTestApp } from '../../src/test-utils/app-factory.js'

describe('Users Routes Integration Tests', () => {
  const app = createTestApp()

  // Reset mock data before each test by creating fresh user data
  const mockUsers = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date("2024-01-01")
    },
    {
      id: 2,
      name: "Jane Smith", 
      email: "jane@example.com",
      createdAt: new Date("2024-01-02")
    }
  ]

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const res = await app.request('/api/users')
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('users')
      expect(Array.isArray(data.users)).toBe(true)
      expect(data.users.length).toBeGreaterThanOrEqual(2)
      
      // Check first user structure
      const user = data.users[0]
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('name')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('createdAt')
    })

    it('should return users with valid email format', async () => {
      const res = await app.request('/api/users')
      const data = await res.json()
      
      data.users.forEach((user: any) => {
        expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      })
    })
  })

  describe('GET /api/users/:id', () => {
    it('should return specific user by ID', async () => {
      const res = await app.request('/api/users/1')
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('user')
      expect(data.user).toHaveProperty('id', 1)
      expect(data.user).toHaveProperty('name')
      expect(data.user).toHaveProperty('email')
      expect(data.user).toHaveProperty('createdAt')
    })

    it('should return 400 for invalid user ID format', async () => {
      const res = await app.request('/api/users/invalid')
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
      expect(data).toHaveProperty('details')
    })

    it('should return 400 for negative user ID', async () => {
      const res = await app.request('/api/users/-1')
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
    })

    it('should return 500 for non-existent user ID', async () => {
      const res = await app.request('/api/users/9999')
      
      expect(res.status).toBe(500)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Database error')
      expect(data.message).toContain('not found')
    })
  })

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: "Alice Johnson",
        email: "alice@example.com"
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
      expect(data.user).toHaveProperty('id')
      expect(data.user).toHaveProperty('name', userData.name)
      expect(data.user).toHaveProperty('email', userData.email)
      expect(data.user).toHaveProperty('createdAt')
      expect(typeof data.user.id).toBe('number')
    })

    it('should return 400 for invalid email format', async () => {
      const userData = {
        name: "Bob Wilson",
        email: "invalid-email"
      }
      
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
      expect(data).toHaveProperty('details')
    })

    it('should return 400 for missing required fields', async () => {
      const userData = {
        name: "Charlie Brown"
        // missing email
      }
      
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
    })

    it('should return 400 for empty name', async () => {
      const userData = {
        name: "",
        email: "test@example.com"
      }
      
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
    })

    it('should return 400 for name too long', async () => {
      const userData = {
        name: "a".repeat(101), // 101 characters, exceeds maxLength(100)
        email: "test@example.com"
      }
      
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
    })
  })

  describe('PUT /api/users/:id', () => {
    it('should update user with valid data', async () => {
      const updateData = {
        name: "John Updated",
        email: "john.updated@example.com"
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
      expect(data.user).toHaveProperty('id', 1)
      expect(data.user).toHaveProperty('name', updateData.name)
      expect(data.user).toHaveProperty('email', updateData.email)
    })

    it('should update user with partial data', async () => {
      const updateData = {
        name: "Jane Updated Only Name"
      }
      
      const res = await app.request('/api/users/2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toHaveProperty('user')
      expect(data.user).toHaveProperty('name', updateData.name)
      expect(data.user).toHaveProperty('email') // original email should remain
    })

    it('should return 400 for invalid user ID', async () => {
      const updateData = { name: "Test" }
      
      const res = await app.request('/api/users/invalid', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
    })

    it('should return 500 for non-existent user ID', async () => {
      const updateData = { name: "Test" }
      
      const res = await app.request('/api/users/9999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      expect(res.status).toBe(500)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Database error')
    })

    it('should return 400 for invalid email in update', async () => {
      const updateData = {
        email: "invalid-email-format"
      }
      
      const res = await app.request('/api/users/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      // First create a user to delete
      const createRes = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "To Be Deleted",
          email: "delete@example.com"
        })
      })
      
      const createData = await createRes.json()
      const userId = createData.user.id
      
      // Now delete the user
      const deleteRes = await app.request(`/api/users/${userId}`, {
        method: 'DELETE'
      })
      
      expect(deleteRes.status).toBe(200)
      
      const deleteData = await deleteRes.json()
      expect(deleteData).toHaveProperty('message', 'User deleted successfully')
      
      // Verify user is deleted
      const getRes = await app.request(`/api/users/${userId}`)
      expect(getRes.status).toBe(500) // Should return database error for not found
    })

    it('should return 400 for invalid user ID', async () => {
      const res = await app.request('/api/users/invalid', {
        method: 'DELETE'
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
    })

    it('should return 500 for non-existent user ID', async () => {
      const res = await app.request('/api/users/9999', {
        method: 'DELETE'
      })
      
      expect(res.status).toBe(500)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Database error')
    })

    it('should return 400 for negative user ID', async () => {
      const res = await app.request('/api/users/-1', {
        method: 'DELETE'
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Validation failed')
    })
  })
})