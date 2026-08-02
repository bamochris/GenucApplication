import { API_BASE_URL } from '../config/apiBaseUrl';
// src/utils/fileUrl.js
// Le backend enregistre les fichiers uploadés (logos, documents...) sous
// des chemins relatifs (ex: "/uploads/universites/xxx.png"), servis en
// statique par Spring depuis son propre port. Le frontend tournant sur un
// port différent, ces chemins doivent être préfixés par l'URL de l'API.

export function resolveFileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
