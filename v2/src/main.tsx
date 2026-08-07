import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useTableStore } from './store/tableStore';
import { useAnalysisStore } from './store/analysisStore';

const viteEnv = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
if (viteEnv?.DEV) {
  (window as unknown as Record<string, unknown>).__MINITAB_TABLES__ = useTableStore;
  (window as unknown as Record<string, unknown>).__MINITAB_ANALYSIS__ = useAnalysisStore;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
