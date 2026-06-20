import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[200px]">
      <div className="relative flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-500"></div>
      </div>
      <p className="mt-4 text-slate-500 font-medium text-sm tracking-wider uppercase animate-pulse">
        Carregando...
      </p>
    </div>
  );
};
