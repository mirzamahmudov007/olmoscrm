import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  threshold?: number;
}

export const useInfiniteScroll = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 100,
}: UseInfiniteScrollOptions) => {
  const observerRef = useRef<IntersectionObserver>();

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      console.log('lastElementRef called:', { node, hasNextPage, isFetchingNextPage });
      
      if (isFetchingNextPage) {
        console.log('Currently fetching, skipping observer setup');
        return;
      }
      
      if (observerRef.current) {
        console.log('Disconnecting previous observer');
        observerRef.current.disconnect();
      }
      
      if (node) {
        console.log('Setting up new observer for node:', node);
        observerRef.current = new IntersectionObserver(
          (entries) => {
            console.log('Intersection observer triggered:', entries);
            if (entries[0].isIntersecting && hasNextPage) {
              console.log('Loading next page...');
              fetchNextPage();
            }
          },
          {
            rootMargin: `${threshold}px`,
            threshold: 0.1,
          }
        );
        
        observerRef.current.observe(node);
      }
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage, threshold]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        console.log('Cleaning up observer');
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { lastElementRef };
}; 