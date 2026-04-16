import client from './client';

/**
 * Get paginated list of spaces accessible to the current user.
 * @param {object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.pageSize=50] - Items per page
 * @param {string} [params.search] - Search by space name
 * @param {boolean} [params.isArchived] - Filter by archived status
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getSpaces = (params = {}) =>
  client.get('/api/spaces', { params });
