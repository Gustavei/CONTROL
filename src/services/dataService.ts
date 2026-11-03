import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  getDoc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { RouteRecord, Driver, calculateQuality } from '../types.ts';

const ROUTES_COLLECTION = 'routes';
const DRIVERS_COLLECTION = 'drivers';

export function subscribeRoutes(
  onData: (routes: RouteRecord[]) => void,
  onError?: (err: unknown) => void
) {
  const q = query(collection(db, ROUTES_COLLECTION), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const routes: RouteRecord[] = [];
      snapshot.forEach((doc) => {
        routes.push({ id: doc.id, ...doc.data() } as RouteRecord);
      });
      onData(routes);
    },
    (error) => {
      console.error('Error fetching routes:', error);
      handleFirestoreError(error, OperationType.LIST, ROUTES_COLLECTION);
      if (onError) onError(error);
    }
  );
}

export function subscribeDrivers(
  onData: (drivers: Driver[]) => void,
  onError?: (err: unknown) => void
) {
  const q = query(collection(db, DRIVERS_COLLECTION), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const drivers: Driver[] = [];
      snapshot.forEach((doc) => {
        drivers.push({ id: doc.id, ...doc.data() } as Driver);
      });
      onData(drivers);
    },
    (error) => {
      console.error('Error fetching drivers:', error);
      handleFirestoreError(error, OperationType.LIST, DRIVERS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

export async function addRoute(route: Omit<RouteRecord, 'id' | 'createdAt'>): Promise<string> {
  const id = `rt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const quality = calculateQuality(route.packages, route.incidences);
  const newRoute: RouteRecord = {
    ...route,
    id,
    quality,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, ROUTES_COLLECTION, id), newRoute);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${ROUTES_COLLECTION}/${id}`);
    throw error;
  }
}

export async function updateRoute(id: string, updates: Partial<RouteRecord>): Promise<void> {
  try {
    let finalUpdates = { ...updates, updatedAt: new Date().toISOString() };
    if (updates.packages !== undefined || updates.incidences !== undefined) {
      const pkgs = updates.packages ?? 1;
      const incs = updates.incidences ?? 0;
      finalUpdates.quality = calculateQuality(pkgs, incs);
    }
    await updateDoc(doc(db, ROUTES_COLLECTION, id), finalUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ROUTES_COLLECTION}/${id}`);
    throw error;
  }
}

export async function deleteRoute(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ROUTES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ROUTES_COLLECTION}/${id}`);
    throw error;
  }
}

export async function addDriver(driver: Omit<Driver, 'id' | 'createdAt'>): Promise<string> {
  const id = `drv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newDriver: Driver = {
    ...driver,
    id,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, DRIVERS_COLLECTION, id), newDriver);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${DRIVERS_COLLECTION}/${id}`);
    throw error;
  }
}

export async function updateDriver(id: string, updates: Partial<Driver>): Promise<void> {
  try {
    await updateDoc(doc(db, DRIVERS_COLLECTION, id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${DRIVERS_COLLECTION}/${id}`);
    throw error;
  }
}

export async function deleteDriver(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, DRIVERS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${DRIVERS_COLLECTION}/${id}`);
    throw error;
  }
}

export async function deleteAllRoutes(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, ROUTES_COLLECTION));
    const count = snap.size;
    if (count === 0) return 0;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, ROUTES_COLLECTION);
    throw error;
  }
}

// Initial realistic seed only once per system lifetime
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  try {
    // 1. Check local browser storage marker
    if (typeof window !== 'undefined' && localStorage.getItem('gls_system_seeded') === 'true') {
      return false;
    }

    // 2. Check persistent flag in Firestore settings collection
    const initRef = doc(db, 'settings', 'system_init');
    const initSnap = await getDoc(initRef);
    if (initSnap.exists()) {
      if (typeof window !== 'undefined') localStorage.setItem('gls_system_seeded', 'true');
      return false; // Already initialized in Firestore! Never re-seed even if all routes were deleted.
    }

    // 3. Check if routes already exist in Firestore
    const existingRoutes = await getDocs(collection(db, ROUTES_COLLECTION));
    if (!existingRoutes.empty) {
      await setDoc(initRef, { seeded: true, initializedAt: new Date().toISOString() });
      if (typeof window !== 'undefined') localStorage.setItem('gls_system_seeded', 'true');
      return false;
    }

    // Mark as seeded BEFORE inserting documents
    await setDoc(initRef, { seeded: true, initializedAt: new Date().toISOString() });
    if (typeof window !== 'undefined') localStorage.setItem('gls_system_seeded', 'true');

    const defaultDrivers: Driver[] = [
      { id: 'drv_osc_1', provider: 'Oscar', name: 'Carlos Silva', phone: '(11) 98765-4321', status: 'active', vehicleType: 'Van Master', licensePlate: 'ABC-1234', createdAt: new Date().toISOString() },
      { id: 'drv_osc_2', provider: 'Oscar', name: 'Roberto Mendes', phone: '(11) 98765-4322', status: 'active', vehicleType: 'Fiorino 1.4', licensePlate: 'DEF-5678', createdAt: new Date().toISOString() },
      { id: 'drv_osc_3', provider: 'Oscar', name: 'Lucas Rocha', phone: '(11) 98765-4323', status: 'active', vehicleType: 'Sprinter 415', licensePlate: 'GHI-9012', createdAt: new Date().toISOString() },
      { id: 'drv_osc_4', provider: 'Oscar', name: 'Fernando Alves', phone: '(11) 98765-4324', status: 'active', vehicleType: 'Daily 35S14', licensePlate: 'JKL-3456', createdAt: new Date().toISOString() },
      { id: 'drv_osc_5', provider: 'Oscar', name: 'Marcelo Lima', phone: '(11) 98765-4325', status: 'active', vehicleType: 'Ducato Maxi', licensePlate: 'MNO-7890', createdAt: new Date().toISOString() },

      { id: 'drv_tia_1', provider: 'Tiago', name: 'Anderson Souza', phone: '(11) 97654-3211', status: 'active', vehicleType: 'Sprinter 516', licensePlate: 'PQR-1122', createdAt: new Date().toISOString() },
      { id: 'drv_tia_2', provider: 'Tiago', name: 'Diego Pereira', phone: '(11) 97654-3212', status: 'active', vehicleType: 'Master L3H2', licensePlate: 'STU-3344', createdAt: new Date().toISOString() },
      { id: 'drv_tia_3', provider: 'Tiago', name: 'Rafael Costa', phone: '(11) 97654-3213', status: 'active', vehicleType: 'Fiorino Endurance', licensePlate: 'VWX-5566', createdAt: new Date().toISOString() },
      { id: 'drv_tia_4', provider: 'Tiago', name: 'Bruno Martins', phone: '(11) 97654-3214', status: 'active', vehicleType: 'Jumpy Cargo', licensePlate: 'YZA-7788', createdAt: new Date().toISOString() },
      { id: 'drv_tia_5', provider: 'Tiago', name: 'Eduardo Santos', phone: '(11) 97654-3215', status: 'active', vehicleType: 'Expert Business', licensePlate: 'BCD-9900', createdAt: new Date().toISOString() },
    ];

    for (const drv of defaultDrivers) {
      await setDoc(doc(db, DRIVERS_COLLECTION, drv.id), drv);
    }

    // Seed recent delivery days
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const initialRoutes: Omit<RouteRecord, 'id' | 'createdAt'>[] = [
      // Today / recent Oscar
      { date: dates[0], provider: 'Oscar', driverId: 'drv_osc_1', driverName: 'Carlos Silva', routeName: 'Rota Centro Comercial', routeNumber: 'RT-101', locality: 'Centro Expandido', volumes: 320, packages: 290, incidences: 6, quality: calculateQuality(290, 6), notes: 'Alta densidade de entregas' },
      { date: dates[0], provider: 'Oscar', driverId: 'drv_osc_2', driverName: 'Roberto Mendes', routeName: 'Rota Zona Sul A', routeNumber: 'RT-102', locality: 'Vila Mariana / Moema', volumes: 250, packages: 220, incidences: 14, quality: calculateQuality(220, 14), notes: 'Chuva no final da tarde gerou retenções' },
      { date: dates[0], provider: 'Oscar', driverId: 'drv_osc_3', driverName: 'Lucas Rocha', routeName: 'Rota Industrial Norte', routeNumber: 'RT-103', locality: 'Distrito Industrial', volumes: 380, packages: 350, incidences: 8, quality: calculateQuality(350, 8), notes: 'Empresas e galpões comerciais' },
      
      // Today / recent Tiago
      { date: dates[0], provider: 'Tiago', driverId: 'drv_tia_1', driverName: 'Anderson Souza', routeName: 'Rota Metropolitana Leste', routeNumber: 'RT-201', locality: 'Tatuapé / Penha', volumes: 290, packages: 260, incidences: 11, quality: calculateQuality(260, 11), notes: 'Excelente ritmo' },
      { date: dates[0], provider: 'Tiago', driverId: 'drv_tia_2', driverName: 'Diego Pereira', routeName: 'Rota Oeste Nobre', routeNumber: 'RT-202', locality: 'Pinheiros / Perdizes', volumes: 270, packages: 240, incidences: 5, quality: calculateQuality(240, 5), notes: 'Meta atingida com folga' },
      { date: dates[0], provider: 'Tiago', driverId: 'drv_tia_3', driverName: 'Rafael Costa', routeName: 'Rota Anel Viário', routeNumber: 'RT-203', locality: 'Marginal Pinheiros', volumes: 310, packages: 280, incidences: 28, quality: calculateQuality(280, 28), notes: 'Acidente de trânsito interditou acesso à ponte' },

      // Yesterday Oscar
      { date: dates[1], provider: 'Oscar', driverId: 'drv_osc_4', driverName: 'Fernando Alves', routeName: 'Rota Sudeste', routeNumber: 'RT-104', locality: 'Ipiranga / Sacomã', volumes: 260, packages: 230, incidences: 7, quality: calculateQuality(230, 7) },
      { date: dates[1], provider: 'Oscar', driverId: 'drv_osc_5', driverName: 'Marcelo Lima', routeName: 'Rota Noroeste', routeNumber: 'RT-105', locality: 'Freguesia do Ó / Limão', volumes: 240, packages: 210, incidences: 4, quality: calculateQuality(210, 4) },
      { date: dates[1], provider: 'Oscar', driverId: 'drv_osc_1', driverName: 'Carlos Silva', routeName: 'Rota Centro Histórico', routeNumber: 'RT-106', locality: 'Sé / República', volumes: 295, packages: 265, incidences: 10, quality: calculateQuality(265, 10) },

      // Yesterday Tiago
      { date: dates[1], provider: 'Tiago', driverId: 'drv_tia_4', driverName: 'Bruno Martins', routeName: 'Rota Litoral Sul', routeNumber: 'RT-204', locality: 'Santos / Baixada', volumes: 340, packages: 300, incidences: 12, quality: calculateQuality(300, 12) },
      { date: dates[1], provider: 'Tiago', driverId: 'drv_tia_5', driverName: 'Eduardo Santos', routeName: 'Rota ABC Paulista', routeNumber: 'RT-205', locality: 'Santo André / SBC', volumes: 330, packages: 290, incidences: 9, quality: calculateQuality(290, 9) },
      { date: dates[1], provider: 'Tiago', driverId: 'drv_tia_1', driverName: 'Anderson Souza', routeName: 'Rota Aeroporto', routeNumber: 'RT-206', locality: 'Cumbica / Guarulhos', volumes: 350, packages: 310, incidences: 8, quality: calculateQuality(310, 8) },

      // Previous days
      { date: dates[2], provider: 'Oscar', driverId: 'drv_osc_2', driverName: 'Roberto Mendes', routeName: 'Rota Vila Velha Sul', routeNumber: 'RT-107', locality: 'Jardim Paulista', volumes: 280, packages: 250, incidences: 6, quality: calculateQuality(250, 6) },
      { date: dates[2], provider: 'Tiago', driverId: 'drv_tia_2', driverName: 'Diego Pereira', routeName: 'Rota Granja Viana', routeNumber: 'RT-207', locality: 'Cotia / Granja', volumes: 210, packages: 190, incidences: 5, quality: calculateQuality(190, 5) },
      { date: dates[3], provider: 'Oscar', driverId: 'drv_osc_3', driverName: 'Lucas Rocha', routeName: 'Rota Alpha Empresarial', routeNumber: 'RT-108', locality: 'Barueri / Alphaville', volumes: 360, packages: 330, incidences: 15, quality: calculateQuality(330, 15) },
      { date: dates[3], provider: 'Tiago', driverId: 'drv_tia_3', driverName: 'Rafael Costa', routeName: 'Rota Morumbi / Panamby', routeNumber: 'RT-208', locality: 'Morumbi', volumes: 275, packages: 245, incidences: 11, quality: calculateQuality(245, 11) },
      { date: dates[4], provider: 'Oscar', driverId: 'drv_osc_4', driverName: 'Fernando Alves', routeName: 'Rota Santana', routeNumber: 'RT-109', locality: 'Zona Norte', volumes: 290, packages: 260, incidences: 5, quality: calculateQuality(260, 5) },
      { date: dates[4], provider: 'Tiago', driverId: 'drv_tia_5', driverName: 'Eduardo Santos', routeName: 'Rota Osasco Centro', routeNumber: 'RT-209', locality: 'Osasco', volumes: 310, packages: 280, incidences: 13, quality: calculateQuality(280, 13) },
    ];

    for (let i = 0; i < initialRoutes.length; i++) {
      const r = initialRoutes[i];
      const id = `seed_rt_${i + 1}`;
      await setDoc(doc(db, ROUTES_COLLECTION, id), {
        ...r,
        id,
        createdAt: new Date().toISOString(),
      });
    }

    return true;
  } catch (err) {
    console.error('Error during data initialization:', err);
    return false;
  }
}
