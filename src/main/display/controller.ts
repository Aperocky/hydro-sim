import PAGE from './elements';
import { MapContainer } from './container';
import { registerButtons } from './buttons';
import { SimAdapter } from './simAdapter';


registerButtons();
export const mapContainer = new MapContainer();
export const simAdapter = new SimAdapter();
mapContainer.initialize(simAdapter.sim);
