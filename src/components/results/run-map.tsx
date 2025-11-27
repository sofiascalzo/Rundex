"use client";

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';
import L from 'leaflet';

type RunMapProps = {
  center: LatLngExpression;
  path?: LatLngExpression[];
  startPoint?: LatLngExpression;
  endPoint?: LatLngExpression;
  mapKey?: string;
  zoom?: number;
  height?: string | number;
};

export default function RunMap({
  center,
  path = [],
  startPoint,
  endPoint,
  mapKey,
  zoom = 15,
  height = "400px",
}: RunMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Rimuove eventuali mappe Leaflet già esistenti sul div
    if (mapRef.current) {
      const existingMap = (mapRef.current as any)._leaflet_map as L.Map | undefined;
      if (existingMap) {
        existingMap.remove();
      }
    }
  }, [center, mapKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="text-primary" />
          Run Path
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          style={{ borderRadius: "var(--radius)", overflow: "hidden", height }}
        >
          <MapContainer
            key={mapKey ?? `${(center as number[]).join('-')}`}
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(mapInstance) => {
              // Salva l'istanza della mappa sul div per poterla rimuovere al prossimo remount
              if (mapRef.current) {
                (mapRef.current as any)._leaflet_map = mapInstance;
              }
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {path.length > 0 && (
              <Polyline pathOptions={{ color: 'hsl(var(--primary))', weight: 5 }} positions={path} />
            )}
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
