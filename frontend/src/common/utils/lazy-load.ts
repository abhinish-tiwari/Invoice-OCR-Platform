import { lazy, ComponentType, LazyExoticComponent } from "react";

// Configuration constants for retry logic
const DEFAULT_RETRIES = 3;
const INITIAL_RETRY_INTERVAL = 1000;
const BACKOFF_MULTIPLIER = 2;

/**
 * Retry function with exponential backoff
 * Attempts to load a component multiple times before failing
 */
const retry = <T extends ComponentType<any>>(
	fn: () => Promise<{ default: T }>,
	retriesLeft = DEFAULT_RETRIES,
	interval = INITIAL_RETRY_INTERVAL
): Promise<{ default: T }> =>
	fn().catch((error) =>
		retriesLeft === 1
			? Promise.reject(error)
			: new Promise<{ default: T }>((resolve, reject) =>
				setTimeout(
					() =>
						retry(fn, retriesLeft - 1, interval * BACKOFF_MULTIPLIER)
							.then(resolve)
							.catch(reject),
					interval
				)
			)
	);

/**
 * Lazy load a component with retry logic
 * Useful for handling network failures during code splitting
 */
export const lazyLoad = <T extends ComponentType<any>>(
	importFunc: () => Promise<{ default: T }>,
	retries = DEFAULT_RETRIES
): LazyExoticComponent<T> => lazy(() => retry(importFunc, retries));

export default lazyLoad;
