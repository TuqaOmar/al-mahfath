import { auth } from './firebase';

/**
 * Reusable helper for authenticated backend requests.
 * Automatically appends the Firebase ID Token to the Authorization header.
 */
export const fetchWithAuth = async (url, options = {}) => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('Authentication required: User not logged in.');
  }

  // Get token; force refresh if needed (false defaults to standard cache behavior)
  const token = await user.getIdToken(false);

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  // Automatically set Content-Type for JSON payloads if a body is provided as an object
  if (options.body && typeof options.body === 'object' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  return response;
};
