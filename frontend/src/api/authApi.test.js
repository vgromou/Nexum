import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, logout, refresh, getMe, changePassword } from './authApi';
import client from './client';
import * as tokenManager from './tokenManager';

// Mock the client module
vi.mock('./client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock tokenManager
vi.mock('./tokenManager', () => ({
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}));

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('calls POST /api/auth/login with credentials', async () => {
      const mockResponse = {
        data: {
          accessToken: 'test-access-token',
          user: { id: '123', email: 'test@example.com' },
          mustChangePassword: false,
        },
      };
      client.post.mockResolvedValue(mockResponse);

      await login('test@example.com', 'password123');

      expect(client.post).toHaveBeenCalledWith('/api/auth/login', {
        login: 'test@example.com',
        password: 'password123',
      });
    });

    it('sets access token after successful login', async () => {
      const mockResponse = {
        data: {
          accessToken: 'test-access-token',
          user: { id: '123' },
          mustChangePassword: false,
        },
      };
      client.post.mockResolvedValue(mockResponse);

      await login('user', 'pass');

      expect(tokenManager.setAccessToken).toHaveBeenCalledWith('test-access-token');
    });

    it('returns user and mustChangePassword', async () => {
      const mockUser = { id: '123', email: 'test@example.com', firstName: 'John' };
      const mockResponse = {
        data: {
          accessToken: 'token',
          user: mockUser,
          mustChangePassword: true,
        },
      };
      client.post.mockResolvedValue(mockResponse);

      const result = await login('user', 'pass');

      expect(result).toEqual({
        user: mockUser,
        mustChangePassword: true,
      });
    });

    it('throws error on failed login', async () => {
      const error = new Error('Invalid credentials');
      error.response = { data: { errorCode: 'INVALID_CREDENTIALS' } };
      client.post.mockRejectedValue(error);

      await expect(login('user', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('calls POST /api/auth/logout', async () => {
      client.post.mockResolvedValue({ data: {} });

      await logout();

      expect(client.post).toHaveBeenCalledWith('/api/auth/logout', {});
    });

    it('clears access token after logout', async () => {
      client.post.mockResolvedValue({ data: {} });

      await logout();

      expect(tokenManager.clearAccessToken).toHaveBeenCalled();
    });

    it('clears token even if API call fails', async () => {
      client.post.mockRejectedValue(new Error('Network error'));

      await logout();

      expect(tokenManager.clearAccessToken).toHaveBeenCalled();
    });

    it('does not throw on API error', async () => {
      client.post.mockRejectedValue(new Error('Network error'));

      await expect(logout()).resolves.toBeUndefined();
    });
  });

  describe('refresh', () => {
    it('calls POST /api/auth/refresh', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
        },
      };
      client.post.mockResolvedValue(mockResponse);

      await refresh();

      expect(client.post).toHaveBeenCalledWith('/api/auth/refresh', {});
    });

    it('sets new access token after successful refresh', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
        },
      };
      client.post.mockResolvedValue(mockResponse);

      await refresh();

      expect(tokenManager.setAccessToken).toHaveBeenCalledWith('new-access-token');
    });

    it('returns accessToken', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
        },
      };
      client.post.mockResolvedValue(mockResponse);

      const result = await refresh();

      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('throws error on failed refresh', async () => {
      const error = new Error('Token expired');
      client.post.mockRejectedValue(error);

      await expect(refresh()).rejects.toThrow('Token expired');
    });
  });

  describe('getMe', () => {
    it('calls GET /api/me', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      client.get.mockResolvedValue({ data: mockUser });

      await getMe();

      expect(client.get).toHaveBeenCalledWith('/api/me');
    });

    it('returns user data', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      client.get.mockResolvedValue({ data: mockUser });

      const result = await getMe();

      expect(result).toEqual(mockUser);
    });

    it('throws error on failed request', async () => {
      const error = new Error('Unauthorized');
      client.get.mockRejectedValue(error);

      await expect(getMe()).rejects.toThrow('Unauthorized');
    });
  });

  describe('changePassword', () => {
    it('calls POST /api/auth/change-password with passwords', async () => {
      client.post.mockResolvedValue({ data: {} });

      await changePassword('oldPass', 'newPass');

      expect(client.post).toHaveBeenCalledWith('/api/auth/change-password', {
        currentPassword: 'oldPass',
        newPassword: 'newPass',
      });
    });

    it('throws error on failed password change', async () => {
      const error = new Error('Current password is incorrect');
      client.post.mockRejectedValue(error);

      await expect(changePassword('wrong', 'new')).rejects.toThrow(
        'Current password is incorrect'
      );
    });
  });
});
