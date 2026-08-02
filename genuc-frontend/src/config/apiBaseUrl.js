// Origine du backend, résolue une seule fois pour toute l'application.
//
// Cinq modules dupliquaient `process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082'`.
// Ce `||` est le défaut : une chaîne vide est falsy, donc impossible de demander
// « même origine » — la valeur retombait sur localhost. Constaté en production le
// 02/08/2026 : le bundle servi depuis https://genuc.up.railway.app appelait
// http://localhost:8082, toutes les requêtes échouaient et l'interface affichait
// « Hors ligne. Reconnectez-vous pour synchroniser. » alors que l'API répondait
// parfaitement — le diagnostic partait donc dans la mauvaise direction.
//
// Règle retenue :
//   - variable NON définie      → http://localhost:8082 (poste de dev, où le
//                                 serveur CRA est sur :3000 et le backend sur
//                                 :8082 ; aucun « proxy » n'est déclaré dans
//                                 package.json)
//   - variable définie, VIDE    → même origine : les requêtes partent en /api/…
//                                 et le reverse proxy les relaie. C'est le mode
//                                 de tout déploiement derrière Nginx.
//   - variable définie, remplie → cette valeur, telle quelle
//
// La distinction « non définie » / « définie mais vide » est possible parce que
// Create React App remplace une variable absente par `undefined` littéral au
// build, et une variable vide par `""`.
const configure = process.env.REACT_APP_API_BASE_URL;

export const API_BASE_URL =
  configure === undefined || configure === null ? 'http://localhost:8082' : configure;

export default API_BASE_URL;
