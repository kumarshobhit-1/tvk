'use client';
import { useState, useEffect } from 'react';

export function useLoading() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Minimum loading time (2 seconds)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    // Also check if page is fully loaded
    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return { isLoading };
}