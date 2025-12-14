import React, { useEffect, useState, useRef } from "react";

type SvgIconProps = {
	name: string;
	className?: string;
	svgStyle?: React.CSSProperties;
};

// Global in-memory cache for SVG content
// This persists across component re-renders and page navigations
const svgCache = new Map<string, string>();

// Track in-flight requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<string>>();

/**
* Fetches SVG content with caching
* - Returns cached content immediately if available
* - Deduplicates concurrent requests for the same icon
* - Caches successful responses for future use
*/
const fetchSvgWithCache = async (name: string): Promise<string> => {
	const url = `/assets/images/svg-icon-paths/${name}.svg`;

	// Return cached content if available
	const cached = svgCache.get(name);
	if (cached) {
		return cached;
	}

	// If there's already a pending request for this icon, wait for it
	const pending = pendingRequests.get(name);
	if (pending) {
		return pending;
	}

	// Create new fetch request
	const fetchPromise = fetch(url)
		.then(async (response) => {
			if (!response.ok) {
				throw new Error(`Failed to load ${name}`);
			}
			const text = await response.text();
			// Cache the successful response
			svgCache.set(name, text);
			// Clean up pending request
			pendingRequests.delete(name);
			return text;
		})
		.catch((error) => {
			// Clean up pending request on error
			pendingRequests.delete(name);
			throw error;
		});

	// Track the pending request
	pendingRequests.set(name, fetchPromise);

	return fetchPromise;
};

const SvgIcon: React.FC<SvgIconProps> = ({ name, className = "", svgStyle }) => {
	const [svgContent, setSvgContent] = useState<string | null>(() => {
		// Initialize with cached content if available (synchronous)
		return svgCache.get(name) || null;
	});
	const [error, setError] = useState<string | null>(null);
	const spanRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		// If already cached, use it immediately
		const cached = svgCache.get(name);
		if (cached) {
			setSvgContent(cached);
			return;
		}

		// Fetch with caching
		let isMounted = true;

		fetchSvgWithCache(name)
			.then((text) => {
				if (isMounted) {
					setSvgContent(text);
				}
			})
			.catch((e) => {
				if (isMounted) {
					setError(e.message);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [name]);

	useEffect(() => {
		if (!svgContent || !svgStyle || !spanRef.current) return;

		const svgElement = spanRef?.current?.querySelector('svg');
		if (svgElement) {
			Object.entries(svgStyle).forEach(([key, value]) => {
				// Convert camelCase to kebab-case for CSS properties
				const cssKey = key?.replace(/([A-Z])/g, '-$1').toLowerCase();
				svgElement?.style?.setProperty(cssKey, String(value));
			});
		}
	}, [svgContent, svgStyle]);

	if (error) {
		return <span style={{ color: "red" }}>{error}</span>;
	}

	if (!svgContent) return null;

	return (
		<span
			ref={spanRef}
			className={className}
			style={{ display: "inline-block" }}
			dangerouslySetInnerHTML={{ __html: svgContent }}
		/>
	);
};

export default SvgIcon;
