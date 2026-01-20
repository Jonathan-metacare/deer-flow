"use client";

import { useEffect, useRef } from "react";

import { cn } from "~/lib/utils";
import { useStore } from "~/core/store";

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
    const mapInstance = useRef<any>(null);
    const targetMarker = useRef<any>(null);
    const userMarker = useRef<any>(null);
    const scriptLoaded = useRef(false);
    const drawingManagerRef = useRef<any>(null);
    const currentOverlayRef = useRef<any>(null);

    // Watch for ongoing research to lock the map
    const ongoingResearchId = useStore((state) => state.ongoingResearchId);
    const isLocked = ongoingResearchId !== null;

    useEffect(() => {
        if (!drawingManagerRef.current) return;

        if (isLocked) {
            // Lock drawing and editing
            drawingManagerRef.current.setDrawingMode(null);
            drawingManagerRef.current.setOptions({
                drawingControl: false
            });
            if (currentOverlayRef.current) {
                currentOverlayRef.current.setEditable(false);
                currentOverlayRef.current.setDraggable(false);
                // Update color to Red to indicate "Active Research" status
                currentOverlayRef.current.setOptions({
                    fillColor: "#ff4d4f",
                    strokeColor: "#ff4d4f"
                });
            }
        } else {
            // Unlock if no research is ongoing
            drawingManagerRef.current.setOptions({
                drawingControl: true
            });
            if (currentOverlayRef.current) {
                currentOverlayRef.current.setEditable(true);
                currentOverlayRef.current.setDraggable(true);
                // Back to default blue if research cleared
                currentOverlayRef.current.setOptions({
                    fillColor: "#007aff",
                    strokeColor: "#007aff"
                });
            }
        }
    }, [isLocked]);

    // Sync map center with store query
    const mapCenterQuery = useStore((state) => state.mapCenterQuery);

    // Handle ESC key to cancel selection
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                // Don't modify if research is locked/ongoing
                if (useStore.getState().ongoingResearchId) return;

                if (currentOverlayRef.current) {
                    // Remove the shape from the map
                    currentOverlayRef.current.setMap(null);
                    currentOverlayRef.current = null;

                    // Clear the selection in the global store
                    useStore.getState().setSelectedRegion(null);
                    console.log("📍 Map Region Selection Cancelled via ESC");
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);
    useEffect(() => {
        if (!mapInstance.current || !mapCenterQuery || !window.google) return;

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: mapCenterQuery }, (results: any, status: any) => {
            if (status === "OK" && results[0]) {
                const location = results[0].geometry.location;
                const map = mapInstance.current;

                // --- Smooth "Fly To" Animation Sequence (Slower & Cinematic) ---
                // 1. Zoom out more to create a stronger sense of movement
                const currentZoom = map.getZoom();
                map.setZoom(Math.max(currentZoom - 4, 4));

                // 2. Pan to destination after 1.5s
                setTimeout(() => {
                    map.panTo(location);

                    // Add or move target marker
                    if (targetMarker.current) {
                        targetMarker.current.setPosition(location);
                        targetMarker.current.setTitle(mapCenterQuery);
                    } else {
                        targetMarker.current = new window.google.maps.Marker({
                            position: location,
                            map: map,
                            title: mapCenterQuery,
                            animation: window.google.maps.Animation.DROP,
                        });
                    }

                    // 3. Zoom back in after another 1.5s (total 3s sequence)
                    setTimeout(() => {
                        map.setOptions({ gestureHandling: 'greedy' });
                        map.setZoom(12);
                    }, 1500);
                }, 1500);

            } else {
                console.warn("Geocode was not successful for the following reason: " + status);
            }
        });
    }, [mapCenterQuery]);

    useEffect(() => {
        if (!mapRef.current) return;

        const initMap = () => {
            if (!mapRef.current || !window.google) return;

            const map = new window.google.maps.Map(mapRef.current, {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
                disableDefaultUI: false,
                fullscreenControl: false,
                streetViewControl: false,
                mapTypeControl: false, // Disable the Map/Satellite toggle
                mapTypeId: 'hybrid',
                backgroundColor: "transparent",
            });
            mapInstance.current = map;

            // Initialize Drawing Manager
            if (window.google.maps.drawing) {
                const drawingManager = new window.google.maps.drawing.DrawingManager({
                    drawingControl: true,
                    drawingControlOptions: {
                        position: window.google.maps.ControlPosition.TOP_CENTER,
                        drawingModes: [
                            // window.google.maps.drawing.OverlayType.POLYGON,
                            window.google.maps.drawing.OverlayType.RECTANGLE,
                        ],
                    },
                    polygonOptions: {
                        fillColor: "#007aff",
                        fillOpacity: 0.3,
                        strokeWeight: 2,
                        strokeColor: "#007aff",
                        clickable: true,
                        editable: true,
                        zIndex: 1,
                    },
                    rectangleOptions: {
                        fillColor: "#007aff",
                        fillOpacity: 0.3,
                        strokeWeight: 2,
                        strokeColor: "#007aff",
                        clickable: true,
                        editable: true,
                        zIndex: 1,
                    }
                });
                drawingManager.setMap(map);
                drawingManagerRef.current = drawingManager;

                window.google.maps.event.addListener(drawingManager, 'overlaycomplete', (event: any) => {
                    // Clear previous overlay
                    if (currentOverlayRef.current) {
                        currentOverlayRef.current.setMap(null);
                    }
                    currentOverlayRef.current = event.overlay;

                    // Extract coordinates based on shape type
                    let regionData: any = null;
                    if (event.type === window.google.maps.drawing.OverlayType.POLYGON) {
                        const path = event.overlay.getPath();
                        const coords = [];
                        for (let i = 0; i < path.getLength(); i++) {
                            coords.push({ lat: path.getAt(i).lat(), lng: path.getAt(i).lng() });
                        }
                        regionData = { type: 'polygon', coordinates: coords };
                    } else if (event.type === window.google.maps.drawing.OverlayType.RECTANGLE) {
                        const bounds = event.overlay.getBounds();
                        regionData = {
                            type: 'rectangle',
                            bounds: {
                                north: bounds.getNorthEast().lat(),
                                south: bounds.getSouthWest().lat(),
                                east: bounds.getNorthEast().lng(),
                                west: bounds.getSouthWest().lng()
                            }
                        };
                    }

                    useStore.getState().setSelectedRegion(regionData);
                    console.log("📍 Map Region Selected:", regionData);
                });
            }

            // Try to set center to current location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        map.setCenter(pos);

                        // Add marker for user location
                        if (userMarker.current) userMarker.current.setMap(null);
                        userMarker.current = new window.google.maps.Marker({
                            position: pos,
                            map: map,
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 8,
                                fillColor: "#4285F4",
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: "white",
                            },
                            title: "Your Location",
                        });
                    },
                    () => {
                        // Fail silently and use DEFAULT_CENTER
                    }
                );
            }
        };

        // Check if script is already loaded
        if (window.google && window.google.maps && window.google.maps.drawing) {
            initMap();
            return;
        }

        if (scriptLoaded.current) return;
        scriptLoaded.current = true;

        // Load Google Maps Script with Drawing library
        const script = document.createElement("script");
        const keyParam = GOOGLE_MAPS_API_KEY ? `key=${GOOGLE_MAPS_API_KEY}&` : "";
        script.src = `https://maps.googleapis.com/maps/api/js?${keyParam}libraries=drawing&callback=initMap`;
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
