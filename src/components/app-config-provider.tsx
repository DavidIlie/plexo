"use client";

import { createContext, useContext } from "react";

interface AppConfig {
   recommendEnabled: boolean;
   turnstileSiteKey?: string;
}

const AppConfigContext = createContext<AppConfig>({
   recommendEnabled: false,
});

export const useAppConfig = () => useContext(AppConfigContext);

export const AppConfigProvider = ({
   children,
   ...config
}: AppConfig & { children: React.ReactNode }) => (
   <AppConfigContext.Provider value={config}>
      {children}
   </AppConfigContext.Provider>
);
