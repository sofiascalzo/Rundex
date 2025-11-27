
"use client"; 

import React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map as MapIcon } from 'lucide-react';

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapIcon className="text-primary" />
          Run Path
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ borderRadius: "var(--radius)", overflow: "hidden" }}>
          <MapContainer
            key={mapKey}
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height, width: "100%" }}
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
