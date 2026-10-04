import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { siteLocations, primaryDealershipSites } from '../constants';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [activeSite, setActiveSiteState] = useState(() => {
    const saved = localStorage.getItem('active_site');
    if (saved && siteLocations.includes(saved)) {
      return saved;
    }
    // If user previously had Fairfield or another outdated site, migrate to 'All Sites'
    return 'All Sites';
  });

  const setActiveSite = useCallback((site) => {
    setActiveSiteState(site);
    localStorage.setItem('active_site', site);
    // Dispatch custom event for any listeners
    window.dispatchEvent(new CustomEvent('site-filter-change', { detail: site }));
  }, []);

  useEffect(() => {
    localStorage.setItem('active_site', activeSite);
  }, [activeSite]);

  const isSiteMatch = useCallback((clientSite, siteToMatch = activeSite) => {
    if (!siteToMatch || siteToMatch === 'All Sites') return true;
    if (!clientSite) return false;
    const clientLower = clientSite.trim().toLowerCase();
    const filterLower = siteToMatch.trim().toLowerCase();
    if (clientLower === filterLower) return true;
    // Flexible matching for e.g. "Caroline Springs" vs "BYD Caroline Springs"
    const strippedFilter = filterLower.replace(/^byd\s+/i, '');
    const strippedClient = clientLower.replace(/^byd\s+/i, '');
    return strippedClient === strippedFilter || clientLower.includes(strippedFilter);
  }, [activeSite]);

  const filterClientsBySite = useCallback((clients, siteToMatch = activeSite) => {
    if (!Array.isArray(clients)) return [];
    if (!siteToMatch || siteToMatch === 'All Sites') return clients;
    return clients.filter((c) => isSiteMatch(c?.site_location, siteToMatch));
  }, [activeSite, isSiteMatch]);

  const value = useMemo(
    () => ({
      activeSite,
      setActiveSite,
      siteLocations,
      primaryDealershipSites,
      isSiteMatch,
      filterClientsBySite,
    }),
    [activeSite, setActiveSite, isSiteMatch, filterClientsBySite]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) {
    // Fallback if rendered outside provider
    const site = localStorage.getItem('active_site') || 'All Sites';
    return {
      activeSite: site,
      setActiveSite: (s) => localStorage.setItem('active_site', s),
      siteLocations,
      primaryDealershipSites,
      isSiteMatch: (clientSite) => !site || site === 'All Sites' || (clientSite && clientSite.toLowerCase().includes(site.toLowerCase().replace(/^byd\s+/i, ''))),
      filterClientsBySite: (list) => list || [],
    };
  }
  return context;
};
