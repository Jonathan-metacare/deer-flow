"use client";

import { useEffect, useRef } from "react";

import { cn } from "~/lib/utils";

// ==========================================
// GOOGLE MAPS CONFIGURATION
// ==========================================
// TODO: Enter your Google Maps API Key here
// You can also use process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const DEFAULT_CENTER = { lat: 39.9042, lng: 116.4074 }; // Beijing
const DEFAULT_ZOOM = 13;

// Minimal Dark Mode Styles for a premium background feel
const MAP_STYLES = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
];

export function GoogleMapBackground({ className }: { className?: string }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const scriptLoaded = useRef(false);

    useEffect(() => {
        if (!mapRef.current) return;

        const initMap = () => {
            if (!mapRef.current || !window.google) return;

            new window.google.maps.Map(mapRef.current, {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
                disableDefaultUI: true,
                styles: MAP_STYLES,
                backgroundColor: "transparent",
            });
        };

        // Check if script is already loaded
        if (window.google && window.google.maps) {
            initMap();
            return;
        }

        if (scriptLoaded.current) return;
        scriptLoaded.current = true;

        // Load Google Maps Script
        const script = document.createElement("script");
        const keyParam = GOOGLE_MAPS_API_KEY ? `key=${GOOGLE_MAPS_API_KEY}&` : "";
        script.src = `https://maps.googleapis.com/maps/api/js?${keyParam}callback=initMap`;
        script.async = true;
        script.defer = true;

        // Attach global callback
        window.initMap = initMap;

        document.head.appendChild(script);

        return () => {
            // Cleanup global callback if needed, though usually harmless
            // window.initMap = undefined; 
            // Do not remove script tag to reuse it
        };
    }, []);

    return (
        <div
            ref={mapRef}
            className={cn("absolute inset-0 z-0 h-full w-full", className)}
            aria-hidden="true"
        />
    );
}

// Add typing for window to avoid TS errors
declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}
