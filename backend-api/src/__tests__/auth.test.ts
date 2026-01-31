import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';

describe('Authentication API', () => {
  let testRestaurant: any;

  beforeEach(async () => {
    // Create a test restaurant
    testRestaurant = await Restaurant.create({
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
      },
      status: 'active',
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          restaurantName: 'New Restaurant',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@test.com');
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject registration with existing email', async () => {
      await User.create({
        email: 'existing@test.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
        firstName: 'Existing',
        lastName: 'User',
        role: 'owner',
        restaurants: [testRestaurant._id],
        currentRestaurant: testRestaurant._id,
        status: 'active',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          restaurantName: 'Another Restaurant',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
          restaurantName: 'New Restaurant',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        email: 'testuser@test.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
        firstName: 'Test',
        lastName: 'User',
        role: 'owner',
        restaurants: [testRestaurant._id],
        currentRestaurant: testRestaurant._id,
        status: 'active',
        emailVerified: true,
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      const user = await User.create({
        email: 'authuser@test.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
        firstName: 'Auth',
        lastName: 'User',
        role: 'owner',
        restaurants: [testRestaurant._id],
        currentRestaurant: testRestaurant._id,
        status: 'active',
        emailVerified: true,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'authuser@test.com',
          password: 'Password123!',
        });

      authToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('authuser@test.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
