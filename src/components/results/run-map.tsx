// src/components/results/run-map.tsx
"use client";

import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';
import type { RawRunDataEntry } from '@/lib/types';
import { useId } from 'react';

interface RunMapProps {
  runData: RawRunDataEntry[];
}

export default function RunMap({ runData }: RunMapProps) {
  const runId = useId();

  const positions = runData
    .map(d => d.position)
    .filter(p => p !== undefined && p.lat !== undefined && p.lng !== undefined) as { lat: number; lng: number }[];

  if (positions.length < 2) {
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

  const path: LatLngExpression[] = positions.map(p => [p.lat, p.lng]);
  const center: LatLngExpression = path[Math.floor(path.length / 2)];
  const startPoint = path[0];
  const endPoint = path[path.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Map className="text-primary"/>
            Run Path
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MapContainer 
            key={runId}
            center={center} 
            zoom={15} 
            scrollWheelZoom={true} 
            style={{ height: '400px', width: '100%', borderRadius: 'var(--radius)' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline pathOptions={{ color: 'hsl(var(--primary))', weight: 5 }} positions={path} />
          <Marker position={startPoint}>
            <Popup>Start of your run</Popup>
          </Marker>
          <Marker position={endPoint}>
            <Popup>End of your run</Popup>
          </Marker>
        </MapContainer>
      </CardContent>
    </Card>
  );
}
