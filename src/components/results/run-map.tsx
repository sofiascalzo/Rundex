// src/components/results/run-map.tsx
"use client"; 

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import type { Map as LeafletMap, LatLngExpression } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

type RunMapProps = {
  center: LatLngExpression | null;
  path?: LatLngExpression[];
  startPoint?: LatLngExpression;
  endPoint?: LatLngExpression;
  runId?: string | number;
  zoom?: number;
  height?: string | number;
};

export default function RunMap({
  center,
  path = [],
  startPoint,
  endPoint,
  runId = "default",
  zoom = 15,
  height = "400px",
}: RunMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (err) {
        // swallow errors during cleanup
      }
    };
  }, []);

  if (!mounted) {
     return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="text-primary" />
            Run Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height, width: "100%", display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'hsl(var(--muted))', borderRadius: 'var(--radius)' }}>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!center || path.length < 2) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Map className="text-primary"/>
                    Run Path
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Not enough location data to display a map. The analysis pipeline generates a path from IMU data.</p>
            </CardContent>
        </Card>
    );
  }
  
  const mapKey = `runmap-${String(runId)}`;

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Map className="text-primary"/>
                Run Path
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div ref={wrapperRef} style={{ borderRadius: "var(--radius)", overflow: "hidden" }}>
                <MapContainer
                    key={mapKey}
                    center={center}
                    zoom={zoom}
                    scrollWheelZoom={true}
                    style={{ height, width: "100%" }}
                    whenCreated={(mapInstance) => {
                        try {
                            if (mapRef.current && mapRef.current !== mapInstance) {
                            mapRef.current.remove();
                            }
                        } catch (err) {
                            // ignore
                        }
                        mapRef.current = mapInstance;
                    }}
                >
                    <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Polyline pathOptions={{ color: 'hsl(var(--primary))', weight: 5 }} positions={path} />
                    {startPoint && (
                        <Marker position={startPoint}>
                            <Popup>Start of your run</Popup>
                        </Marker>
                    )}
                    {endPoint && (
                        <Marker position={endPoint}>
                            <Popup>End of your run</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </CardContent>
    </Card>
  );
}
