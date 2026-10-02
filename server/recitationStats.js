export function calculatePageRecitationStats(sessions, userId, pageNumber) {
  const pNum = Number(pageNumber);
  const empty = {
    hasAttempts: false,
    totalAttempts: 0,
    averageAccuracy: 0,
    bestAccuracy: 0,
    lastRecitedAt: null,
    recentAttempts: []
  };

  if (!userId) return empty;

  const attempts = (sessions || []).filter(
    session => session.userId === userId && session.pageNumber === pNum
  );
  if (attempts.length === 0) return empty;

  const accuracies = attempts.map(attempt => Number(attempt.accuracy) || 0);
  const total = accuracies.reduce((sum, value) => sum + value, 0);

  return {
    hasAttempts: true,
    totalAttempts: attempts.length,
    averageAccuracy: Math.round(total / accuracies.length),
    bestAccuracy: Math.max(...accuracies),
    lastRecitedAt: attempts[0].createdAt,
    recentAttempts: attempts.slice(0, 10)
  };
}
