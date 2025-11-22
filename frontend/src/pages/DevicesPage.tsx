import React, { useState } from 'react';
import { Button, Card } from '../design-system';

type Device = { id: string; name: string; type: 'e-paper' | 'tablet' | 'phone'; connected: boolean; transport?: 'wifi' | 'ble' };

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([
    { id: 'd1', name: 'E-Paper A1', type: 'e-paper', connected: false },
    { id: 'd2', name: 'Reader Tablet', type: 'tablet', connected: false },
    { id: 'd3', name: 'BLE Tag', type: 'e-paper', connected: false }
  ]);

  const connect = (id: string, transport: 'wifi' | 'ble') => {
    setDevices((list) => list.map(d => d.id === id ? { ...d, connected: true, transport } : d));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Devices</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {devices.map((d) => (
          <Card key={d.id}>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                {d.type === 'e-paper' ? '📟' : d.type === 'tablet' ? '📱' : '📲'}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{d.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{d.connected ? `Connected via ${d.transport?.toUpperCase()}` : 'Not connected'}</div>
                <div className="flex gap-2 mt-3">
                  {!d.connected && (
                    <>
                      <Button onClick={() => connect(d.id, 'wifi')}>Connect Wi‑Fi</Button>
                      <Button variant="secondary" onClick={() => connect(d.id, 'ble')}>Pair BLE</Button>
                    </>
                  )}
                  {d.connected && (
                    <>
                      <Button variant="secondary">Publish Latest E‑Paper</Button>
                      <Button variant="secondary">Preview</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DevicesPage;
