import { auth } from './firebase';
import { fetchWithAuth } from './api';

const stable = value => value && typeof value === 'object'
  ? (Array.isArray(value) ? value.map(stable) : Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])))
  : value;

export async function saveLearningProfile(userId, learningProfile, learningStyle) {
  if (!userId || auth.currentUser?.uid !== userId) throw new Error('Authentication required');
  const response = await fetchWithAuth(`/api/user/${encodeURIComponent(userId)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    // Send a patch, so unrelated preferences are retained by the transaction.
    body: JSON.stringify({ preferences: { learningProfile, learningStyle } })
  });
  const result = await response.json();
  if (auth.currentUser?.uid !== userId) throw new Error('Authentication changed while saving');
  if (!response.ok || result.success !== true || result.persisted !== true ||
      result.user?.uid !== userId || result.user?.preferences?.learningStyle !== learningStyle ||
      JSON.stringify(stable(result.user?.preferences?.learningProfile)) !== JSON.stringify(stable(learningProfile))) {
    throw new Error(result.message || 'Could not confirm learning profile persistence');
  }
  return result;
}
