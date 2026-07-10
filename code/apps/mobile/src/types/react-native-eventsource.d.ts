declare module 'react-native-eventsource' {
  export default class EventSource {
    constructor(url: string, options?: any);
    addEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
    removeAllListeners(): void;
    close(): void;
  }
}
