import React, { createContext, useContext, useState } from 'react';

type BrandingState = {
  systemName: string;
  setSystemName: (name: string) => void;
  logoColor: string;
  setLogoColor: (color: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
};

const initialState: BrandingState = {
  systemName: 'VanniLoan',
  setSystemName: () => null,
  logoColor: 'primary',
  setLogoColor: () => null,
  logoUrl: '',
  setLogoUrl: () => null,
};

const BrandingContext = createContext<BrandingState>(initialState);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [systemName, setSystemNameState] = useState<string>(
    () => localStorage.getItem('branding-name') || 'VanniLoan'
  );
  
  const [logoColor, setLogoColorState] = useState<string>(
    () => localStorage.getItem('branding-color') || 'primary'
  );

  const [logoUrl, setLogoUrlState] = useState<string>(
    () => localStorage.getItem('branding-logo-url') || ''
  );

  const setSystemName = (name: string) => {
    localStorage.setItem('branding-name', name);
    setSystemNameState(name);
  };

  const setLogoColor = (color: string) => {
    localStorage.setItem('branding-color', color);
    setLogoColorState(color);
  };

  const setLogoUrl = (url: string) => {
    localStorage.setItem('branding-logo-url', url);
    setLogoUrlState(url);
  };

  return (
    <BrandingContext.Provider value={{ systemName, setSystemName, logoColor, setLogoColor, logoUrl, setLogoUrl }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
