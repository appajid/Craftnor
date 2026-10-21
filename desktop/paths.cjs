const path = require('node:path');
function resolveAsset(root, requestUrl) {
  const url = new URL(requestUrl);
  if (url.protocol !== 'craftnor:' || url.hostname !== 'studio') throw new Error('Invalid app origin');
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.includes('\\') || pathname.includes('\0')) throw new Error('Invalid asset path');
  const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Asset path is outside the application');
  return target;
}
module.exports = { resolveAsset };
