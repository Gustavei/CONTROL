import React, { useState, useEffect } from 'react';
import { X, Gauge, Calendar, Truck, ArrowRight, Save, AlertCircle } from 'lucide-react';
import { MileageLog, Driver, RouteRecord, ProviderName } from '../types.ts';

interface MileageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<MileageLog, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  editingLog?: MileageLog | null;
  drivers: Driver[];
  routes?: RouteRecord[];
  defaultProvider?: ProviderName;
}

export const MileageModal: React.FC<MileageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLog,
  drivers,
  routes = [],
  defaultProvider = 'Oscar',
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [provider, setProvider] = useState<ProviderName>(defaultProvider);
  const [driverName, setDriverName] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleModel, setVehicleModel] = useState<string>('');
  const [routeNumber, setRouteNumber] = useState<string>('');
  const [startKm, setStartKm] = useState<number | string>(112000);
  const [endKm, setEndKm] = useState<number | string>(112180);
  const [notes, setNotes] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const providerDrivers = drivers.filter((d) => d.provider === provider && d.status === 'active');

  useEffect(() => {
    if (editingLog) {
      setDate(editingLog.date);
      setProvider(editingLog.provider);
      setDriverName(editingLog.driverName);
      setVehiclePlate(editingLog.vehiclePlate);
      setVehicleModel(editingLog.vehicleModel || '');
      setRouteNumber(editingLog.routeNumber || '');
      setStartKm(editingLog.startKm);
      setEndKm(editingLog.endKm);
      setNotes(editingLog.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setProvider(defaultProvider);
      if (providerDrivers.length > 0) {
        setDriverName(providerDrivers[0].name);
        setVehiclePlate(providerDrivers[0].licensePlate || '');
        setVehicleModel(providerDrivers[0].vehicleType || '');
      } else {
        setDriverName('');
        setVehiclePlate('');
        setVehicleModel('');
      }
      setRouteNumber('');
      setStartKm(112000);
      setEndKm(112180);
      setNotes('');
    }
  }, [editingLog, isOpen, defaultProvider]);

  const numStart = Number(startKm) || 0;
  const numEnd = Number(endKm) || 0;
  const calculatedTotal = Math.max(0, numEnd - numStart);

  const handleDriverSelect = (selectedName: string) => {
    setDriverName(selectedName);
    const d = providerDrivers.find((drv) => drv.name === selectedName);
    if (d) {
      if (d.licensePlate) setVehiclePlate(d.licensePlate);
      if (d.vehicleType) setVehicleModel(d.vehicleType);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!vehiclePlate.trim()) {
      setErrorMsg('Informe a placa do veículo.');
      return;
    }
    if (numEnd < numStart) {
      setErrorMsg('O KM Final não pode ser menor que o KM Inicial.');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          date,
          provider,
          driverName: driverName.trim() || 'Motorista Padrão',
          vehiclePlate: vehiclePlate.trim().toUpperCase(),
          vehicleModel: vehicleModel.trim(),
          routeNumber: routeNumber.trim(),
          startKm: numStart,
          endKm: numEnd,
          totalKm: calculatedTotal,
          notes: notes.trim(),
        },
        editingLog?.id
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar quilometragem.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0057B8] text-white p-5 flex items-center justify-between border-b-4 border-[#FFD100]">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFD100] text-[#002B5C] p-2 rounded-lg font-black">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {editingLog ? 'Editar Registro de Quilometragem' : 'Registrar Odômetro / KM da Rota'}
              </h3>
              <p className="text-xs text-blue-100">
                KM Inicial (saída) e KM Final (retorno)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Data & Provedor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Data da Operação:
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Provedor:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Oscar', 'Tiago'] as const).map((prov) => (
                  <button
                    type="button"
                    key={prov}
                    onClick={() => {
                      setProvider(prov);
                      const pDrivers = drivers.filter((d) => d.provider === prov);
                      if (pDrivers.length > 0) {
                        setDriverName(pDrivers[0].name);
                        setVehiclePlate(pDrivers[0].licensePlate || '');
                        setVehicleModel(pDrivers[0].vehicleType || '');
                      }
                    }}
                    className={`py-1.5 px-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 ${
                      provider === prov
                        ? 'bg-[#0057B8] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${prov === 'Oscar' ? 'bg-[#FFD100]' : 'bg-amber-400'}`} />
                    {prov}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Motorista & Placa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Motorista:
              </label>
              {providerDrivers.length > 0 ? (
                <select
                  value={driverName}
                  onChange={(e) => handleDriverSelect(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
                >
                  <option value="">Selecione...</option>
                  {providerDrivers.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} {d.licensePlate ? `(${d.licensePlate})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Nome do motorista..."
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
                />
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Placa do Veículo:
              </label>
              <input
                type="text"
                required
                placeholder="Ex: ABC-1234"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md uppercase font-bold focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
              />
            </div>
          </div>

          {/* Rota Vinculada */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Código / Nome da Rota (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: RT-101 - Centro Expandido"
              value={routeNumber}
              onChange={(e) => setRouteNumber(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
            />
          </div>

          {/* Odômetros Inicial, Final e Total */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Registro de Odômetro (KM)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  KM Inicial (Saída):
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={startKm}
                  onChange={(e) => setStartKm(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  KM Final (Retorno):
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={endKm}
                  onChange={(e) => setEndKm(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
                />
              </div>
            </div>

            {/* Calculated Distance */}
            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Distância Total Percorrida:</span>
              <span className="text-lg font-black text-emerald-600">
                {calculatedTotal.toLocaleString('pt-BR')} KM
              </span>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Observações:
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Desvio de trânsito pela rodovia..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold bg-[#0057B8] hover:bg-blue-700 text-white rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#FFD100]" />
              {saving ? 'Gravando...' : editingLog ? 'Atualizar KM' : 'Salvar KM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
