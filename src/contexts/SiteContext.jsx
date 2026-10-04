import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { siteLocations as allSiteLocations, primaryDealershipSites as allPrimarySites } from '../constants';
import { useAuth } from './AuthContext';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const auth = useAuth();
  const lockedSite = auth?.user?.locked_site || null;
  const siteLocations = useMemo(() => (lockedSite ? [lockedSite] : allSiteLocations), [lockedSite]);
  const primaryDealershipSites = useMemo(() => (lockedSite ? [lockedSite] : allPrimarySites), [lockedSite]);

  const [savedSite, setActiveSiteState] = useState(() => {
    const saved = localStorage.getItem('active_site');
    if (saved && allSiteLocations.includes(saved)) {
      return saved;
    }
    // If user previously had Fairfield or another outdated site, migrate to 'All Sites'
    return 'All Sites';
  });
  // A site-locked user is always pinned to their own site
  const activeSite = lockedSite || savedSite;

  const setActiveSite = useCallback((site) => {
    if (lockedSite) return;
    setActiveSiteState(site);
    localStorage.setItem('active_site', site);
    // Dispatch custom event for any listeners
    window.dispatchEvent(new CustomEvent('site-filter-change', { detail: site }));
  }, [lockedSite]);

  useEffect(() => {
    if (!lockedSite) localStorage.setItem('active_site', activeSite);
  }, [activeSite, lockedSite]);

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
    [activeSite, setActiveSite, siteLocations, primaryDealershipSites, isSiteMatch, filterClientsBySite]
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
      siteLocations: allSiteLocations,
      primaryDealershipSites: allPrimarySites,
      isSiteMatch: (clientSite) => !site || site === 'All Sites' || (clientSite && clientSite.toLowerCase().includes(site.toLowerCase().replace(/^byd\s+/i, ''))),
      filterClientsBySite: (list) => list || [],
    };
  }
  return context;
};
