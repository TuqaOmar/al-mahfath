// Small in-memory, per-user rate limiter for the costly AI endpoints (no extra dependency).
// Must run after requireAuth so req.user.uid is set; falls back to the client IP.
// Note: on serverless hosts (Vercel) each warm instance keeps its own counters, so this
// limits bursts per instance rather than giving an exact global quota.
export function rateLimit({ windowMs = 60_000, max = 20, name = 'default' } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const key = `${name}:${req.user?.uid || req.ip}`;
    const now = Date.now();
    const recent = (hits.get(key) || []).filter(time => now - time < windowMs);
    if (recent.length >= max) {
      const retryAfter = Math.ceil((windowMs - (now - recent[0])) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, message: `طلبات كثيرة، حاولي بعد ${retryAfter} ثانية.` });
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
    next();
  };
}
