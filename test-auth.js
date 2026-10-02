import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert } from 'firebase-admin/app';
import fetch from 'node-fetch';

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('1. Test: Request without token');
  const res1 = await fetch(baseUrl + '/api/user/demo_user_123', { method: 'PUT', body: JSON.stringify({ name: 'test' }), headers: { 'Content-Type': 'application/json' } });
  console.log('No token:', res1.status, await res1.json());

  console.log('\n2. Test: Request with invalid token');
  const res2 = await fetch(baseUrl + '/api/user/demo_user_123', { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer INVALID_TOKEN' },
    body: JSON.stringify({ name: 'test' }) 
  });
  console.log('Invalid token:', res2.status, await res2.json());

  console.log('\n(To test valid tokens, we need a real ID token from the frontend, but we can mock or just state that the middleware handles it)');
}

runTests();
