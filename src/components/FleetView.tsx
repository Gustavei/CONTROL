import React, { useState, useMemo } from 'react';
import {
  Gauge,
  Fuel,
  Wrench,
  DollarSign,
  TrendingUp,
  PlusCircle,
  Truck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  FileSpreadsheet,
  Edit2,
  Trash2,
  BarChart3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  FuelLog,
  MaintenanceLog,
  MileageLog,
  Driver,
  ProviderName,
} from '../types.ts';
import { ConfirmDeleteModal } from './ConfirmDeleteModal.tsx';

interface FleetViewProps {
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  mileageLogs: MileageLog[];
  drivers: Driver[];
  isAdmin: boolean;
  onOpenFuelModal: (log?: FuelLog) => void;
  onDeleteFuelLog: (id: string) => void;
  onOpenMaintenanceModal: (log?: MaintenanceLog) => void;
  onDeleteMaintenanceLog: (id: string) => void;
  onOpenMileageModal: (log?: MileageLog) => void;
  onDeleteMileageLog: (id: string) => void;
}

type FleetSubTab = 'overview' | 'fuel' | 'maintenance' | 'mileage';

export const FleetView: React.FC<FleetViewProps> = ({
  fuelLogs,
  maintenanceLogs,
  mileageLogs,
  drivers,
  isAdmin,
  onOpenFuelModal,
  onDeleteFuelLog,
  onOpenMaintenanceModal,
  onDeleteMaintenanceLog,
  onOpenMileageModal,
  onDeleteMileageLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<FleetSubTab>('overview');
  const [providerFilter, setProviderFilter] = useState<'all' | ProviderName>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals for delete confirmation
  const [fuelToDelete, setFuelToDelete] = useState<FuelLog | null>(null);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<MaintenanceLog | null>(null);
  const [mileageToDelete, setMileageToDelete] = useState<MileageLog | null>(null);

  // Filtered datasets
  const filteredFuel = useMemo(() => {
    return fuelLogs.filter((f) => {
      if (providerFilter !== 'all' && f.provider !== providerFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          f.vehiclePlate.toLowerCase().includes(term) ||
          f.driverName.toLowerCase().includes(term) ||
          (f.stationName && f.stationName.toLowerCase().includes(term)) ||
          f.fuelType.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [fuelLogs, providerFilter, searchTerm]);

  const filteredMaintenance = useMemo(() => {
    return maintenanceLogs.filter((m) => {
      if (providerFilter !== 'all' && m.provider !== providerFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          m.vehiclePlate.toLowerCase().includes(term) ||
          m.description.toLowerCase().includes(term) ||
          m.category.toLowerCase().includes(term) ||
          m.workshop.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [maintenanceLogs, providerFilter, searchTerm]);

  const filteredMileage = useMemo(() => {
    return mileageLogs.filter((k) => {
      if (providerFilter !== 'all' && k.provider !== providerFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          k.vehiclePlate.toLowerCase().includes(term) ||
          k.driverName.toLowerCase().includes(term) ||
          (k.routeNumber && k.routeNumber.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [mileageLogs, providerFilter, searchTerm]);

  // Global calculations
  const totalKm = useMemo(() => {
    return filteredMileage.reduce((acc, curr) => acc + (Number(curr.totalKm) || 0), 0);
  }, [filteredMileage]);

  const totalFuelCost = useMemo(() => {
    return filteredFuel.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0);
  }, [filteredFuel]);

  const totalFuelLiters = useMemo(() => {
    return filteredFuel.reduce((acc, curr) => acc + (Number(curr.liters) || 0), 0);
  }, [filteredFuel]);

  const totalMaintenanceCost = useMemo(() => {
    return filteredMaintenance.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
  }, [filteredMaintenance]);

  const totalFleetCost = totalFuelCost + totalMaintenanceCost;

  // Efficiency metrics
  const avgKmLiter = totalFuelLiters > 0 && totalKm > 0 ? (totalKm / totalFuelLiters).toFixed(2) : '0.00';
  const costPerKm = totalKm > 0 ? (totalFleetCost / totalKm).toFixed(2) : '0.00';

  // Provider breakdowns
  const oscarFuel = fuelLogs.filter((f) => f.provider === 'Oscar').reduce((a, c) => a + c.totalCost, 0);
  const tiagoFuel = fuelLogs.filter((f) => f.provider === 'Tiago').reduce((a, c) => a + c.totalCost, 0);
  const oscarMaint = maintenanceLogs.filter((m) => m.provider === 'Oscar').reduce((a, c) => a + c.cost, 0);
  const tiagoMaint = maintenanceLogs.filter((m) => m.provider === 'Tiago').reduce((a, c) => a + c.cost, 0);
  const oscarKm = mileageLogs.filter((k) => k.provider === 'Oscar').reduce((a, c) => a + c.totalKm, 0);
  const tiagoKm = mileageLogs.filter((k) => k.provider === 'Tiago').reduce((a, c) => a + c.totalKm, 0);

  // Export Fleet Summary to CSV
  const exportFleetCsv = () => {
    const lines: string[] = [];
    lines.push('RELATÓRIO DE CONTROLE DE FROTA - GLS GESTÃO DE QUALIDADE');
    lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('');
    lines.push('--- ABASTECIMENTOS ---');
    lines.push('Data;Provedor;Motorista;Placa;Modelo;KM;Combustível;Litros;Preço/L;Total (R$);Posto;NF');
    filteredFuel.forEach((f) => {
      lines.push(`${f.date};${f.provider};"${f.driverName}";"${f.vehiclePlate}";"${f.vehicleModel || ''}";${f.odometerKm};${f.fuelType};${f.liters};${f.pricePerLiter};${f.totalCost};"${f.stationName || ''}";"${f.receiptNumber || ''}"`);
    });
    lines.push('');
    lines.push('--- MANUTENÇÃO & REPAROS ---');
    lines.push('Data;Provedor;Motorista;Placa;Odômetro;Tipo;Categoria;Descrição;Valor (R$);Oficina;Status');
    filteredMaintenance.forEach((m) => {
      lines.push(`${m.date};${m.provider};"${m.driverName || ''}";"${m.vehiclePlate}";${m.odometerKm};${m.type};"${m.category}";"${m.description.replace(/"/g, '""')}";${m.cost};"${m.workshop}";${m.status}`);
    });
    lines.push('');
    lines.push('--- QUILOMETRAGEM DIÁRIA ---');
    lines.push('Data;Provedor;Motorista;Placa;Rota;KM Inicial;KM Final;KM Total');
    filteredMileage.forEach((k) => {
      lines.push(`${k.date};${k.provider};"${k.driverName}";"${k.vehiclePlate}";"${k.routeNumber || ''}";${k.startKm};${k.endKm};${k.totalKm}`);
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GLS_Controle_Frota_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#002B5C] flex items-center gap-2">
            <Gauge className="w-6 h-6 text-[#0057B8]" />
            Controle de Frota: Quilometragem, Combustível & Manutenção
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão integrada de custos operacionais, consumo por KM e manutenção veicular GLS
          </p>
        </div>

        {/* Action Buttons & Provider Filter */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Provider Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['all', 'Oscar', 'Tiago'] as const).map((prov) => (
              <button
                key={prov}
                onClick={() => setProviderFilter(prov)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  providerFilter === prov
                    ? 'bg-[#0057B8] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {prov === 'all' ? 'Ambos' : prov}
              </button>
            ))}
          </div>

          <button
            onClick={exportFleetCsv}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-300 transition"
            title="Exportar dados da frota em CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenFuelModal()}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-xs transition"
                title="Cadastrar Abastecimento"
              >
                <Fuel className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Combustível</span>
              </button>
              <button
                onClick={() => onOpenMaintenanceModal()}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-xs transition"
                title="Registrar Manutenção"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Manutenção</span>
              </button>
              <button
                onClick={() => onOpenMileageModal()}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-xs transition"
                title="Registrar Odômetro"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Odômetro</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards: Frota Geral */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KM Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Quilometragem Total</span>
            <Gauge className="w-4 h-4 text-[#0057B8]" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-slate-900">
              {totalKm.toLocaleString('pt-BR')} <span className="text-xs font-bold text-slate-400">KM</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Oscar: {oscarKm.toLocaleString('pt-BR')} | Tiago: {tiagoKm.toLocaleString('pt-BR')}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            Registros de rotas auditadas
          </div>
        </div>

        {/* Combustível R$ */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Combustível Total</span>
            <Fuel className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-amber-600">
              R$ {totalFuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {totalFuelLiters.toFixed(1)} L abastecidos
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            Oscar: R$ {oscarFuel.toFixed(0)} | Tiago: R$ {tiagoFuel.toFixed(0)}
          </div>
        </div>

        {/* Manutenção R$ */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Manutenção & Oficina</span>
            <Wrench className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-indigo-600">
              R$ {totalMaintenanceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {filteredMaintenance.length} serviços realizados
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            Oscar: R$ {oscarMaint.toFixed(0)} | Tiago: R$ {tiagoMaint.toFixed(0)}
          </div>
        </div>

        {/* Consumo Médio KM/L */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Média de Consumo</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-emerald-600">
              {avgKmLiter} <span className="text-xs font-bold text-slate-400">KM/L</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Eficiência geral da frota
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            Estimativa de autonomia
          </div>
        </div>

        {/* Custo Total da Frota & R$/KM */}
        <div className="bg-[#002B5C] text-white p-4 rounded-xl shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-blue-200">
            <span className="text-[10px] font-bold uppercase tracking-wider">Custo Total Frota</span>
            <DollarSign className="w-4 h-4 text-[#FFD100]" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-[#FFD100]">
              R$ {totalFleetCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-blue-200 font-semibold mt-0.5">
              R$ {costPerKm} / KM rodado
            </div>
          </div>
          <div className="text-[10px] text-blue-300 pt-1 border-t border-blue-900">
            Combustível + Manutenção
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 shadow-xs">
        {[
          { id: 'overview' as FleetSubTab, label: 'Visão Geral & Indicadores', icon: BarChart3 },
          { id: 'fuel' as FleetSubTab, label: `Abastecimentos (${filteredFuel.length})`, icon: Fuel },
          { id: 'maintenance' as FleetSubTab, label: `Manutenção (${filteredMaintenance.length})`, icon: Wrench },
          { id: 'mileage' as FleetSubTab, label: `Odômetro & KM (${filteredMileage.length})`, icon: Gauge },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm border-b-2 transition ${
                isActive
                  ? 'border-[#0057B8] text-[#0057B8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar for Records */}
      {activeSubTab !== 'overview' && (
        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por placa, motorista, oficina ou rota..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
            />
          </div>
          <div className="text-xs text-slate-500">
            Filtrando por <strong>{providerFilter === 'all' ? 'Todos os Provedores' : `Provedor ${providerFilter}`}</strong>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: Visão Geral & Indicadores */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Comparativo de Custos Oscar vs Tiago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Oscar Side */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-base text-[#0057B8]">
                  <span className="w-3 h-3 rounded-full bg-[#0057B8]" />
                  PROVEDOR OSCAR - CUSTOS DE FROTA
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0057B8]">
                  {oscarKm.toLocaleString('pt-BR')} KM
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-amber-500" />
                    Combustível:
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    R$ {oscarFuel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-indigo-600" />
                    Manutenção & Peças:
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    R$ {oscarMaint.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center font-bold">
                  <span className="text-slate-700">Custo Total Oscar:</span>
                  <span className="text-base font-black text-[#0057B8]">
                    R$ {(oscarFuel + oscarMaint).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600 text-[11px] flex justify-between">
                  <span>Custo por KM Rodado:</span>
                  <span className="font-bold text-slate-900">
                    R$ {oscarKm > 0 ? ((oscarFuel + oscarMaint) / oscarKm).toFixed(2) : '0.00'} / KM
                  </span>
                </div>
              </div>
            </div>

            {/* Tiago Side */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-base text-[#002B5C]">
                  <span className="w-3 h-3 rounded-full bg-[#FFD100] border border-amber-400" />
                  PROVEDOR TIAGO - CUSTOS DE FROTA
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                  {tiagoKm.toLocaleString('pt-BR')} KM
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-amber-500" />
                    Combustível:
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    R$ {tiagoFuel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-indigo-600" />
                    Manutenção & Peças:
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    R$ {tiagoMaint.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center font-bold">
                  <span className="text-slate-700">Custo Total Tiago:</span>
                  <span className="text-base font-black text-[#002B5C]">
                    R$ {(tiagoFuel + tiagoMaint).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600 text-[11px] flex justify-between">
                  <span>Custo por KM Rodado:</span>
                  <span className="font-bold text-slate-900">
                    R$ {tiagoKm > 0 ? ((tiagoFuel + tiagoMaint) / tiagoKm).toFixed(2) : '0.00'} / KM
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas de Manutenção Preventiva Próxima */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Controle de Manutenção Preventiva & Alertas de Revisão
            </h3>

            {maintenanceLogs.filter((m) => m.nextMaintenanceKm || m.nextMaintenanceDate).length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                Nenhum agendamento ou alerta de próxima manutenção registrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {maintenanceLogs
                  .filter((m) => m.nextMaintenanceKm || m.nextMaintenanceDate)
                  .slice(0, 6)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900">{m.vehiclePlate}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {m.provider}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">{m.description}</div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] space-y-0.5">
                        {m.nextMaintenanceKm && (
                          <div className="flex justify-between text-slate-600">
                            <span>Próxima Troca (KM):</span>
                            <span className="font-bold text-[#0057B8]">{m.nextMaintenanceKm.toLocaleString('pt-BR')} KM</span>
                          </div>
                        )}
                        {m.nextMaintenanceDate && (
                          <div className="flex justify-between text-slate-600">
                            <span>Data Limite:</span>
                            <span className="font-bold text-slate-800">
                              {m.nextMaintenanceDate.split('-').reverse().join('/')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Abastecimentos & Combustível */}
      {activeSubTab === 'fuel' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">
              Histórico de Abastecimentos ({filteredFuel.length})
            </h3>
            {isAdmin && (
              <button
                onClick={() => onOpenFuelModal()}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Novo Abastecimento
              </button>
            )}
          </div>

          {filteredFuel.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum abastecimento encontrado para os critérios selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Provedor</th>
                    <th className="px-4 py-3">Motorista</th>
                    <th className="px-4 py-3">Veículo / Placa</th>
                    <th className="px-4 py-3 text-right">Odômetro</th>
                    <th className="px-4 py-3">Combustível</th>
                    <th className="px-4 py-3 text-right">Litros</th>
                    <th className="px-4 py-3 text-right">Preço / L</th>
                    <th className="px-4 py-3 text-right">Total (R$)</th>
                    <th className="px-4 py-3">Posto / NF</th>
                    {isAdmin && <th className="px-4 py-3 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFuel.map((fuel) => (
                    <tr key={fuel.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-2.5 whitespace-nowrap font-medium">
                        {fuel.date.split('-').reverse().join('/')}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            fuel.provider === 'Oscar'
                              ? 'bg-blue-100 text-[#0057B8]'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {fuel.provider}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {fuel.driverName}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{fuel.vehiclePlate}</span>
                        {fuel.vehicleModel && (
                          <span className="text-[10px] text-slate-400 block">{fuel.vehicleModel}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-700 whitespace-nowrap">
                        {fuel.odometerKm.toLocaleString('pt-BR')} KM
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {fuel.fuelType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                        {fuel.liters.toFixed(1)} L
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        R$ {fuel.pricePerLiter.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-amber-600 text-sm whitespace-nowrap">
                        R$ {fuel.totalCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-[11px]">
                        {fuel.stationName || '-'} {fuel.receiptNumber ? `(${fuel.receiptNumber})` : ''}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenFuelModal(fuel)}
                              className="p-1 text-slate-400 hover:text-[#0057B8] rounded"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setFuelToDelete(fuel)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: Manutenção & Reparos */}
      {activeSubTab === 'maintenance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">
              Histórico de Manutenções & Reparos ({filteredMaintenance.length})
            </h3>
            {isAdmin && (
              <button
                onClick={() => onOpenMaintenanceModal()}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Registrar Manutenção
              </button>
            )}
          </div>

          {filteredMaintenance.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum registro de manutenção encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Provedor</th>
                    <th className="px-4 py-3">Veículo / Placa</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Descrição do Serviço</th>
                    <th className="px-4 py-3 text-right">KM</th>
                    <th className="px-4 py-3 text-right">Valor (R$)</th>
                    <th className="px-4 py-3">Oficina</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    {isAdmin && <th className="px-4 py-3 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaintenance.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-2.5 whitespace-nowrap font-medium">
                        {m.date.split('-').reverse().join('/')}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            m.provider === 'Oscar'
                              ? 'bg-blue-100 text-[#0057B8]'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {m.provider}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-bold text-slate-900">
                        {m.vehiclePlate}
                        {m.vehicleModel && (
                          <span className="text-[10px] text-slate-400 block font-normal">{m.vehicleModel}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.type === 'Preventiva'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">
                        {m.category}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate" title={m.description}>
                        {m.description}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-700 whitespace-nowrap">
                        {m.odometerKm.toLocaleString('pt-BR')} KM
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-indigo-700 text-sm whitespace-nowrap">
                        R$ {m.cost.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-[11px]">
                        {m.workshop}
                      </td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'Concluída'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.status === 'Em Andamento'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenMaintenanceModal(m)}
                              className="p-1 text-slate-400 hover:text-[#0057B8] rounded"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setMaintenanceToDelete(m)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: Odômetro & Quilometragem */}
      {activeSubTab === 'mileage' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">
              Controle Diário de Quilometragem das Rotas ({filteredMileage.length})
            </h3>
            {isAdmin && (
              <button
                onClick={() => onOpenMileageModal()}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Registrar Quilometragem
              </button>
            )}
          </div>

          {filteredMileage.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum registro de quilometragem encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Provedor</th>
                    <th className="px-4 py-3">Motorista</th>
                    <th className="px-4 py-3">Veículo / Placa</th>
                    <th className="px-4 py-3">Rota</th>
                    <th className="px-4 py-3 text-right">KM Inicial (Saída)</th>
                    <th className="px-4 py-3 text-right">KM Final (Retorno)</th>
                    <th className="px-4 py-3 text-right">KM Total Rodado</th>
                    <th className="px-4 py-3">Observações</th>
                    {isAdmin && <th className="px-4 py-3 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMileage.map((km) => (
                    <tr key={km.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-2.5 whitespace-nowrap font-medium">
                        {km.date.split('-').reverse().join('/')}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            km.provider === 'Oscar'
                              ? 'bg-blue-100 text-[#0057B8]'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {km.provider}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {km.driverName}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-bold text-slate-800">
                        {km.vehiclePlate}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-[#0057B8] font-bold">
                        {km.routeNumber || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-600 whitespace-nowrap">
                        {km.startKm.toLocaleString('pt-BR')} KM
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-600 whitespace-nowrap">
                        {km.endKm.toLocaleString('pt-BR')} KM
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                        {km.totalKm.toLocaleString('pt-BR')} KM
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-[11px]">
                        {km.notes || '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenMileageModal(km)}
                              className="p-1 text-slate-400 hover:text-[#0057B8] rounded"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setMileageToDelete(km)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Modals */}
      <ConfirmDeleteModal
        isOpen={fuelToDelete !== null}
        title="Excluir Abastecimento"
        message="Tem certeza que deseja excluir este registro de abastecimento? O custo será recalculado em tempo real."
        itemName={fuelToDelete ? `${fuelToDelete.vehiclePlate} - ${fuelToDelete.liters}L (${fuelToDelete.fuelType}) - R$ ${fuelToDelete.totalCost.toFixed(2)}` : undefined}
        onConfirm={async () => {
          if (fuelToDelete) {
            await onDeleteFuelLog(fuelToDelete.id);
            setFuelToDelete(null);
          }
        }}
        onCancel={() => setFuelToDelete(null)}
      />

      <ConfirmDeleteModal
        isOpen={maintenanceToDelete !== null}
        title="Excluir Manutenção"
        message="Tem certeza que deseja excluir este registro de manutenção? Os custos de frota serão atualizados."
        itemName={maintenanceToDelete ? `${maintenanceToDelete.vehiclePlate} - ${maintenanceToDelete.category} - R$ ${maintenanceToDelete.cost.toFixed(2)}` : undefined}
        onConfirm={async () => {
          if (maintenanceToDelete) {
            await onDeleteMaintenanceLog(maintenanceToDelete.id);
            setMaintenanceToDelete(null);
          }
        }}
        onCancel={() => setMaintenanceToDelete(null)}
      />

      <ConfirmDeleteModal
        isOpen={mileageToDelete !== null}
        title="Excluir Registro de Odômetro"
        message="Tem certeza que deseja excluir este registro de quilometragem?"
        itemName={mileageToDelete ? `${mileageToDelete.vehiclePlate} - ${mileageToDelete.totalKm} KM (${mileageToDelete.date.split('-').reverse().join('/')})` : undefined}
        onConfirm={async () => {
          if (mileageToDelete) {
            await onDeleteMileageLog(mileageToDelete.id);
            setMileageToDelete(null);
          }
        }}
        onCancel={() => setMileageToDelete(null)}
      />
    </div>
  );
};
