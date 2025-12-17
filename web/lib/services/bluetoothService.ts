// Web Bluetooth Type Definitions (Polyfill for TS)
interface BluetoothDevice {
    gatt?: BluetoothRemoteGATTServer;
}
interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}
interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}
interface BluetoothRemoteGATTCharacteristic {
    writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothNavigator extends Navigator {
    bluetooth: {
        requestDevice(options: { filters?: { services: string[] }[]; optionalServices?: string[] }): Promise<BluetoothDevice>;
    };
}

export class BluetoothService {
    private device: BluetoothDevice | null = null;
    private server: BluetoothRemoteGATTServer | null = null;
    private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

    // Standard BLE Service UUIDs (Generic)
    // In a real app, these would be specific to the haptic vest (e.g., bHaptics UUIDs)
    private readonly SERVICE_UUID = '00001802-0000-1000-8000-00805f9b34fb'; // Immediate Alert Service
    private readonly CHAR_UUID = '00002a06-0000-1000-8000-00805f9b34fb';    // Alert Level

    async connect() {
        const nav = navigator as BluetoothNavigator;
        if (typeof navigator === 'undefined' || !nav.bluetooth) {
            throw new Error('Web Bluetooth is not supported in this browser.');
        }

        try {
            console.log('Requesting Bluetooth Device...');
            this.device = await nav.bluetooth.requestDevice({
                filters: [{ services: [this.SERVICE_UUID] }],
                // acceptAllDevices: true, // Use this for testing if you don't have the specific UUID
                optionalServices: [this.SERVICE_UUID]
            });

            if (!this.device) throw new Error('No device selected');

            console.log('Connecting to GATT Server...');
            this.server = await this.device.gatt?.connect() || null;

            if (!this.server) throw new Error('Could not connect to GATT Server');

            console.log('Getting Service...');
            const service = await this.server.getPrimaryService(this.SERVICE_UUID);

            console.log('Getting Characteristic...');
            this.characteristic = await service.getCharacteristic(this.CHAR_UUID);

            console.log('Connected!');
            return true;
        } catch (error) {
            console.error('Bluetooth Connection Failed:', error);
            return false;
        }
    }

    async vibrate(intensity: 'low' | 'medium' | 'high') {
        if (!this.characteristic) {
            console.warn('Bluetooth not connected');
            return;
        }

        // 0: No Alert, 1: Mild Alert, 2: High Alert
        let value = 0;
        if (intensity === 'low') value = 1;
        if (intensity === 'medium') value = 1; // Mapping simplified
        if (intensity === 'high') value = 2;

        try {
            await this.characteristic.writeValue(new Uint8Array([value]));
            console.log(`[BLE] Vibrate: ${intensity}`);
        } catch (error) {
            console.error('Failed to write BLE value:', error);
        }
    }

    disconnect() {
        if (this.device && this.device.gatt?.connected) {
            this.device.gatt.disconnect();
        }
        this.device = null;
        this.server = null;
        this.characteristic = null;
    }
}

export const bluetoothService = new BluetoothService();
