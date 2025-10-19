/**
 * Shared Document Hook
 * ✅ CRITICAL OPTIMIZATION: Prevents multiple gadgets from fetching the same document
 * 
 * Instead of each gadget fetching independently:
 * - DetailCardsGadget → Fetch document
 * - TimelineGadget → Fetch document (duplicate!)
 * - Other gadgets → Fetch document (duplicate!)
 * 
 * This hook creates a shared cache:
 * - First gadget → Fetches and caches
 * - Other gadgets → Reuse cached data
 * 
 * Result: 1 fetch instead of N fetches (80% reduction for 5 gadgets)
 */

import { useEffect, useState, useCallback } from "react";
import { BaseGadget, GadgetContext } from "../../../base";
import { extractDataWithPath } from "../utils/documentNavigator";

// ✅ OPTIMIZATION: Page session ID ensures fresh data on navigation
// All gadgets on the SAME page load share cache
// But navigating away and back gets fresh data
let currentPageSessionId = `page-${Date.now()}`;

// Listen for navigation changes
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    currentPageSessionId = `page-${Date.now()}`;
    documentCache.clear(); // Clear on navigation
  });
  
  // Also clear on workspace changes
  const originalPushState = window.history.pushState;
  window.history.pushState = function(...args) {
    currentPageSessionId = `page-${Date.now()}`;
    documentCache.clear(); // Clear on navigation
    return originalPushState.apply(this, args);
  };
}

// Global cache for shared document data
const documentCache = new Map<string, {
  data: any;
  timestamp: number;
  loading: boolean;
  error: string | null;
  subscribers: Set<(data: any) => void>;
  sessionId: string;
}>();

// Global refetch triggers (incremented when cache is cleared)
const refetchTriggers = new Map<string, number>();

const CACHE_TTL = 60000; // 60 seconds (long TTL since we clear on navigation)

interface UseSharedDocumentOptions {
  dataUrl: string;
  dataPath?: string;
  context?: GadgetContext;
  enabled?: boolean;
}

/**
 * Shared document hook with caching
 * Multiple gadgets can use this with the same URL and get cached data
 */
export const useSharedDocument = (options: UseSharedDocumentOptions) => {
  const { dataUrl, dataPath, context, enabled = true } = options;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve URL with placeholders
  const resolvedUrl = BaseGadget.resolvePlaceholders(dataUrl, context);

  // ✅ CRITICAL FIX: Normalize cache key to prevent duplicate fetches
  // Extract document ID and create a consistent cache key regardless of query params
  const urlObj = new URL(resolvedUrl, window.location.origin);
  const documentId = urlObj.pathname.split('/').pop(); // Get document ID from path
  const cacheKey = `doc:${documentId}`; // Use document ID as cache key
  
  // Watch for refetch triggers
  const [trigger, setTrigger] = useState(0);
  
  useEffect(() => {
    const checkTrigger = setInterval(() => {
      const currentTrigger = refetchTriggers.get(cacheKey) || 0;
      if (currentTrigger > trigger) {
        setTrigger(currentTrigger);
      }
    }, 100);
    
    return () => clearInterval(checkTrigger);
  }, [cacheKey, trigger]);

  const fetchDocument = useCallback(async () => {
    console.log("[useSharedDocument] fetchDocument called:", {
      enabled,
      resolvedUrl,
      cacheKey,
      hasPlaceholders: /\{[^}]+\}/.test(resolvedUrl),
    });

    if (!enabled) {
      setLoading(false);
      return;
    }

    // Check for unresolved placeholders
    if (/\{[^}]+\}/.test(resolvedUrl)) {
      console.error("[useSharedDocument] Unresolved placeholders in URL:", resolvedUrl);
      setError("Missing required parameters");
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = documentCache.get(cacheKey);
    const now = Date.now();

    // Check if cache is from current page session
    const isSameSession = cached?.sessionId === currentPageSessionId;
    
    console.log("[useSharedDocument] Cache check:", {
      cacheKey,
      hasCached: !!cached,
      isSameSession,
      isLoading: cached?.loading,
      hasError: !!cached?.error,
      cacheAge: cached ? now - cached.timestamp : 0,
      ttl: CACHE_TTL,
      shouldUseCache: cached && isSameSession && !cached.loading && !cached.error && (now - cached.timestamp) < CACHE_TTL
    });
    
    if (cached && isSameSession && !cached.loading && !cached.error && (now - cached.timestamp) < CACHE_TTL) {
      // Use cached data
      console.log("[useSharedDocument] ✅ Using cached data:", cacheKey);
      // Extract data ONLY if dataPath is NOT "data" (already unwrapped)
      const extractedData = (dataPath && dataPath !== "data")
        ? extractDataWithPath(cached.data, dataPath)
        : cached.data;
        
      setData(extractedData);
      setLoading(false);
      setError(null);
      return;
    }

    // Check if already loading
    if (cached?.loading) {
      // Subscribe to the existing fetch
      const unsubscribe = new Promise<void>((resolve) => {
        const callback = (fetchedData: any) => {
          // Extract data ONLY if dataPath is NOT "data" (already unwrapped)
          const extractedData = (dataPath && dataPath !== "data")
            ? extractDataWithPath(fetchedData, dataPath)
            : fetchedData;
            
          setData(extractedData);
          setLoading(false);
          setError(null);
          resolve();
        };
        cached.subscribers.add(callback);
      });
      
      return unsubscribe;
    }

    // Start new fetch
    console.log("[useSharedDocument] 🚀 Starting new fetch:", {
      cacheKey,
      resolvedUrl,
      sessionId: currentPageSessionId
    });
    
    const cacheEntry = {
      data: null,
      timestamp: now,
      loading: true,
      error: null,
      subscribers: new Set<(data: any) => void>(),
      sessionId: currentPageSessionId, // ✅ Track which page session this cache belongs to
    };
    documentCache.set(cacheKey, cacheEntry);

    setLoading(true);
    setError(null);

    try {
      const response = await BaseGadget.makeAuthenticatedFetch(resolvedUrl);

      if (response.status === 401) {
        BaseGadget.forceLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch data (${response.status})`);
      }

      const payload = await response.json();
      const rawData = payload.data || payload;

      // Update cache with RAW data (not extracted)
      cacheEntry.data = rawData;
      cacheEntry.loading = false;
      cacheEntry.timestamp = Date.now();

      // Extract data ONLY if dataPath is NOT "data" (already unwrapped)
      // If dataPath is "data", we already have it from payload.data
      const extractedData = (dataPath && dataPath !== "data")
        ? extractDataWithPath(rawData, dataPath)
        : rawData;
      
      console.log("[useSharedDocument] ✅ Data fetched successfully:", {
        url: resolvedUrl,
        rawDataKeys: rawData ? Object.keys(rawData).slice(0, 5) : [],
        extractedDataKeys: extractedData ? Object.keys(extractedData).slice(0, 5) : [],
        dataPath,
        skipExtraction: !dataPath || dataPath === "data",
      });
      
      setData(extractedData);
      setLoading(false);

      // Notify subscribers
      cacheEntry.subscribers.forEach((callback) => callback(rawData));
      cacheEntry.subscribers.clear();

    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch data";
      
      cacheEntry.error = errorMsg;
      cacheEntry.loading = false;
      
      setError(errorMsg);
      setLoading(false);

      // Notify subscribers of error
      cacheEntry.subscribers.clear();
    }
  }, [resolvedUrl, cacheKey, dataPath, enabled]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument, trigger]);

  const refetch = useCallback(() => {
    // Clear cache for this URL
    documentCache.delete(cacheKey);
    fetchDocument();
  }, [cacheKey, fetchDocument]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};

/**
 * Clear all cached documents
 */
export const clearDocumentCache = () => {
  documentCache.clear();
};

/**
 * Clear specific document from cache and trigger refetch
 */
export const clearDocumentFromCache = (url: string) => {
  // ✅ FIX: Extract document ID from URL to match normalized cache key
  try {
    const urlObj = new URL(url, window.location.origin);
    const documentId = urlObj.pathname.split('/').pop();
    const cacheKey = `doc:${documentId}`;
    
    console.log("[clearDocumentFromCache] Clearing cache:", { url, cacheKey });
    documentCache.delete(cacheKey);
    
    // Trigger refetch for all components using this document
    const currentTrigger = refetchTriggers.get(cacheKey) || 0;
    refetchTriggers.set(cacheKey, currentTrigger + 1);
  } catch (error) {
    console.warn("[clearDocumentFromCache] Failed to parse URL:", url, error);
    // Fallback to original behavior
    documentCache.delete(url);
    const currentTrigger = refetchTriggers.get(url) || 0;
    refetchTriggers.set(url, currentTrigger + 1);
  }
};

