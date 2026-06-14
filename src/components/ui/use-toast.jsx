import React from "react";

// 🛡️ Agnostic Mock Engine: Absorbs all toast calls quietly without mounting DOM elements
export function useToast() {
  const toast = ({ title, description }) => {
    // În loc de popup blocat, vedem logul curat în Debug Console / Terminal
    console.log(`[SYSTEM NOTIFICATION LOG]: ${title} - ${description}`);
  };

  return {
    toast,
    toasts: [],
    dismiss: () => {},
  };
}

export { useToast as toast };