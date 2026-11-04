export type ProviderName = 'Oscar' | 'Tiago';

export interface RouteRecord {
  id: string;
  date: string; // YYYY-MM-DD
  provider: ProviderName;
  driverId: string;
  driverName: string;
  routeName: string;
  routeNumber: string;
  locality: string;
  volumes: number;
  packages: number;
  incidences: number;
  quality: number; // percentage: ((packages - incidences) / packages) * 100
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Driver {
  id: string;
  provider: ProviderName;
  name: string;
  phone?: string;
  status: 'active' | 'inactive';
  vehicleType?: string;
  licensePlate?: string;
  createdAt: string;
}

export type FuelType = 'Diesel S10' | 'Gasolina Comum' | 'Gasolina Aditivada' | 'Etanol' | 'GNV' | 'Arla 32';

export interface FuelLog {
  id: string;
  date: string; // YYYY-MM-DD
  provider: ProviderName;
  driverName: string;
  vehiclePlate: string;
  vehicleModel?: string;
  odometerKm: number;
  fuelType: FuelType;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  stationName?: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MaintenanceType = 'Preventiva' | 'Corretiva';
export type MaintenanceStatus = 'Concluída' | 'Agendada' | 'Em Andamento';

export interface MaintenanceLog {
  id: string;
  date: string; // YYYY-MM-DD
  provider: ProviderName;
  driverName?: string;
  vehiclePlate: string;
  vehicleModel?: string;
  odometerKm: number;
  type: MaintenanceType;
  category: string; // ex: Óleo e Filtros, Freios, Pneus, Suspensão, Motor, Elétrica, etc.
  description: string;
  cost: number;
  workshop: string;
  invoiceNumber?: string;
  nextMaintenanceKm?: number;
  nextMaintenanceDate?: string;
  status: MaintenanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MileageLog {
  id: string;
  date: string; // YYYY-MM-DD
  provider: ProviderName;
  driverName: string;
  vehiclePlate: string;
  vehicleModel?: string;
  routeNumber?: string;
  startKm: number;
  endKm: number;
  totalKm: number; // endKm - startKm
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type QualityClassification = 'VERDE' | 'AMARELO' | 'VERMELHO';

export interface QualityMetrics {
  totalRoutes: number;
  totalVolumes: number;
  totalPackages: number;
  totalIncidences: number;
  qualityPercentage: number;
  classification: QualityClassification;
  goalMet: boolean;
  deltaToGoal: number; // difference to 94%
}

export interface RankingItem {
  id: string;
  label: string;
  subLabel?: string;
  provider?: ProviderName;
  quality: number;
  totalRoutes: number;
  totalPackages: number;
  totalIncidences: number;
  classification: QualityClassification;
}

export interface FilterState {
  periodPreset: 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'year' | 'all' | 'custom';
  startDate: string;
  endDate: string;
  provider: 'all' | ProviderName;
  driverName: string;
  search: string;
}

export const CONTRACTUAL_GOAL = 94.0;
export const WARNING_THRESHOLD = 90.0;

export function getQualityClassification(percentage: number): QualityClassification {
  if (percentage > CONTRACTUAL_GOAL) return 'VERDE';
  if (percentage >= WARNING_THRESHOLD) return 'AMARELO';
  return 'VERMELHO';
}

export function calculateQuality(packages: number, incidences: number): number {
  if (!packages || packages <= 0) return 100;
  const qual = ((packages - incidences) / packages) * 100;
  return Math.max(0, Math.min(100, Number(qual.toFixed(2))));
}
