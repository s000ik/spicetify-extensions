// NAME: Speedify
// AUTHOR: Satwik Singh
// DESCRIPTION: Hardware-accelerated performance optimization for Spotify client

(async () => {
  while (!Spicetify.React || !Spicetify.ReactDOM) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  const allowedOverflow = ["auto", "scroll"];

  // Optimized debounce with proper typing
  const debounce = <T extends (...args: any[]) => void>(
    fn: T,
    delay: number,
    immediate = false
  ) => {
    let timeoutId: NodeJS.Timeout | undefined;
    return (...args: Parameters<T>) => {
      const callNow = immediate && !timeoutId;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = undefined;
        if (!immediate) fn(...args);
      }, delay);
      if (callNow) fn(...args);
    };
  };

  // Optimized RAF throttle for smooth animations
  const rafThrottle = <T extends (...args: any[]) => void>(fn: T) => {
    let scheduledId: number | null = null;
    return (...args: Parameters<T>) => {
      if (scheduledId) return;
      scheduledId = requestAnimationFrame(() => {
        fn(...args);
        scheduledId = null;
      });
    };
  };

  // WeakMap for style caching
  const elementCache = new WeakMap<HTMLElement, CSSStyleDeclaration>();
  const getComputedStyleCached = (element: HTMLElement) => {
    if (!elementCache.has(element)) {
      elementCache.set(element, window.getComputedStyle(element));
    }
    return elementCache.get(element);
  };

  const optimization = () => {
    // Use a more specific selector for better performance
    const elements = document.querySelectorAll<HTMLElement>('[style*="overflow"],[style*="overflow-y"]');
    const elementsToOptimize: HTMLElement[] = [];

    elements.forEach((element) => {
      if (element.hasAttribute("data-optimized")) return;

      const style = getComputedStyleCached(element);
      const isScrollable = style && (allowedOverflow.includes(style.overflow) || 
                          allowedOverflow.includes(style.overflowY));
      
      // Skip optimization for special elements
      const isContextMenu = element.closest("#context-menu");
      const isPopup = element.classList.contains("popup");
      const isDialog = element.getAttribute("role") === "dialog";
      const isAriaHasPopup = element.getAttribute("aria-haspopup") === "true";

      if (isScrollable && !isContextMenu && !isPopup && !isDialog && !isAriaHasPopup) {
        elementsToOptimize.push(element);
      }
    });

    if (elementsToOptimize.length > 0) {
      requestAnimationFrame(() => {
        elementsToOptimize.forEach(element => {
          // Apply GPU acceleration
          element.style.willChange = "transform";
          element.style.transform = "translate3d(0, 0, 0)";
          
          // Enable smooth scrolling
          element.style.scrollBehavior = "smooth";
          
          // Mark as optimized
          element.setAttribute("data-optimized", "true");

          // Add passive scroll listener
          element.addEventListener('scroll', rafThrottle(() => {
            requestAnimationFrame(() => {
              element.style.pointerEvents = "none";
              requestAnimationFrame(() => {
                element.style.pointerEvents = "auto";
              });
            });
          }), { passive: true });
        });
      });
    }
  };

  // Optimize mutation observer
  const debouncedOptimization = debounce(optimization, 100, true);
  const observer = new MutationObserver((mutations) => {
    if (mutations.some(m => m.addedNodes.length > 0 || m.type === "attributes")) {
      debouncedOptimization();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"]
  });

  // Handle navigation
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    debouncedOptimization();
  };

  window.addEventListener("popstate", debouncedOptimization);

  // Initial optimization
  optimization();
})();