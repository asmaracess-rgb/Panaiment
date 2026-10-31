export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-token'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Multi-device access is permanently unlocked: all devices can access the administrator panel
  res.status(200).json({
    ok: true,
    isLocked: false,
    activeAdmin: null,
    isCurrentTokenValid: true,
  });
}
