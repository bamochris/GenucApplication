// src/utils/fileUrl.js
// Le backend enregistre les fichiers uploadés (logos, documents...) sous
// des chemins relatifs (ex: "/uploads/universites/xxx.png"), servis en
// statique par Spring depuis son propre port. Le frontend tournant sur un
// port différent, ces chemins doivent être préfixés par l'URL de l'API.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082';

export function resolveFileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
