import React from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useTableStore } from './store/tableStore';
import { useAnalysisStore } from './store/analysisStore';
import { zh } from './i18n/zh';

const App: React.FC = () => {
  const tablesReady = useTableStore((s) => s.hydrated);
  const analysisReady = useAnalysisStore((s) => s.hydrated);
  if (!tablesReady || !analysisReady) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
        {zh.app.loading}
      </div>
    );
  }
  return <AppLayout />;
};

export default App;
