import React from 'react';

// 🛡️ Completely disabled the toast rendering engine to prevent UI lockups under Electron
export function Toaster() {
  return null; // Nu mai randează nimic, zero impact vizual sau de performanță
}