 /**
 * Configurații globale ale aplicației preluate din variabilele de mediu (.env)
 * adaptate pentru rularea pe un server local Node.js + Express.
 */

const getAppParams = () => {
  return {
    // Adresa URL de bază a API-ului tău Express (Implicit http://localhost:3000/api)
    apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    
    // Mediul curent de rulare (development, production etc.)
    appEnv: import.meta.env.MODE || 'development',
    
    // URL-ul de bază al aplicației Frontend (ex: http://localhost:5173)
    appBaseUrl: window.location.origin
  };
};

export const appParams = {
  ...getAppParams()
};
