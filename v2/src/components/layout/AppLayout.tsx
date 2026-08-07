import React, { useState } from 'react';
import { Ribbon } from './Ribbon';
import { Sidebar } from './Sidebar';
import { Workspace } from './Workspace';

export const AppLayout: React.FC = () => {
  const [sidebarWidth, setSidebarWidth] = useState(240);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const handleMouseMove = (ev: MouseEvent) => {
      setSidebarWidth(Math.max(180, Math.min(500, startWidth + ev.clientX - startX)));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      <Ribbon />
      <div className="flex flex-1 overflow-hidden">
        <div style={{ width: sidebarWidth }} className="flex-shrink-0 border-r border-gray-200 bg-gray-50/50 overflow-y-auto">
          <Sidebar />
        </div>
        <div className="w-0.5 cursor-col-resize bg-transparent hover:bg-blue-300 active:bg-blue-500 flex-shrink-0 transition-colors" onMouseDown={handleMouseDown} />
        <div className="flex-1 overflow-hidden bg-white">
          <Workspace />
        </div>
      </div>
    </div>
  );
};
