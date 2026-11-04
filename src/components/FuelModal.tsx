import React, { useState, useEffect } from 'react';
import { X, Fuel, Calendar, Gauge, DollarSign, FileText, MapPin, Save, AlertCircle } from 'lucide-react';
import { FuelLog, Driver, ProviderName, FuelType } from '../types.ts';

interface FuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<FuelLog, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  editingLog?: FuelLog | null;
  drivers: Driver[];
  defaultProvider?: ProviderName;
}

export const FuelModal: React.FC<FuelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLog,
  drivers,
  defaultProvider = 'Oscar',
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [provider, setProvider] = useState<ProviderName>(defaultProvider);
  const [driverName, setDriverName] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleModel, setVehicleModel] = useState<string>('');
  const [odometerKm, setOdometerKm] = useState<number | string>(100000);
  const [fuelType, setFuelType] = useState<FuelType>('Diesel S10');
  const [liters, setLiters] = useState<number | string>(60);
  const [pricePerLiter, setPricePerLiter] = useState<number | string>(6.05);
  const [totalCost, setTotalCost] = useState<number | string>(363);
  const [stationName, setStationName] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
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
      setOdometerKm(editingLog.odometerKm);
      setFuelType(editingLog.fuelType);
      setLiters(editingLog.liters);
      setPricePerLiter(editingLog.pricePerLiter);
      setTotalCost(editingLog.totalCost);
      setStationName(editingLog.stationName || '');
      setReceiptNumber(editingLog.receiptNumber || '');
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
      setOdometerKm(110000);
      setFuelType('Diesel S10');
      setLiters(60);
      setPricePerLiter(6.05);
      setTotalCost(363.00);
      setStationName('Posto Ipiranga');
      setReceiptNumber('');
      setNotes('');
    }
  }, [editingLog, isOpen, defaultProvider]);

  // Auto calculate total cost when liters or price changes
  const handleLitersChange = (val: string) => {
    setLiters(val);
    const l = parseFloat(val) || 0;
    const p = parseFloat(String(pricePerLiter)) || 0;
    setTotalCost(Number((l * p).toFixed(2)));
  };

  const handlePriceChange = (val: string) => {
    setPricePerLiter(val);
    const p = parseFloat(val) || 0;
    const l = parseFloat(String(liters)) || 0;
    setTotalCost(Number((l * p).toFixed(2)));
  };

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
    const numLiters = parseFloat(String(liters)) || 0;
    const numTotal = parseFloat(String(totalCost)) || 0;

    if (numLiters <= 0) {
      setErrorMsg('Quantidade de litros deve ser maior que zero.');
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
          odometerKm: Number(odometerKm) || 0,
          fuelType,
          liters: numLiters,
          pricePerLiter: parseFloat(String(pricePerLiter)) || 0,
          totalCost: numTotal,
          stationName: stationName.trim(),
          receiptNumber: receiptNumber.trim(),
          notes: notes.trim(),
        },
        editingLog?.id
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar abastecimento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0057B8] text-white p-5 flex items-center justify-between border-b-4 border-[#FFD100]">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFD100] text-[#002B5C] p-2 rounded-lg font-black">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {editingLog ? 'Editar Registro de Abastecimento' : 'Novo Abastecimento de Combustível'}
              </h3>
              <p className="text-xs text-blue-100">
                Controle de custos por litro, odômetro e consumo da frota
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

          {/* Row 1: Data & Provedor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Data do Abastecimento:
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

          {/* Motorista & Veículo */}
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

          {/* Modelo & Odômetro */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Modelo do Veículo:
              </label>
              <input
                type="text"
                placeholder="Ex: Van Master, Fiorino"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Odômetro (KM Atual):
              </label>
              <div className="relative">
                <Gauge className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  required
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
                />
              </div>
            </div>
          </div>

          {/* Combustível & Valores */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Dados do Abastecimento
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Combustível:
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as FuelType)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
                >
                  <option value="Diesel S10">Diesel S10</option>
                  <option value="Gasolina Comum">Gasolina Comum</option>
                  <option value="Gasolina Aditivada">Gasolina Aditivada</option>
                  <option value="Etanol">Etanol</option>
                  <option value="GNV">GNV</option>
                  <option value="Arla 32">Arla 32</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Litros:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={liters}
                  onChange={(e) => handleLitersChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Preço / Litro (R$):
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.01"
                  required
                  value={pricePerLiter}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
                />
              </div>
            </div>

            {/* Total Cost Display / Manual Override */}
            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Valor Total do Abastecimento:</span>
              <div className="flex items-center gap-1 text-[#0057B8] font-black text-base">
                <span>R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="w-24 text-right font-black border-b border-blue-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Posto e Nota Fiscal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Posto / Estabelecimento:
              </label>
              <input
                type="text"
                placeholder="Ex: Posto Ipiranga Rodoanel"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Nº Nota Fiscal / Cupom:
              </label>
              <input
                type="text"
                placeholder="Ex: NF-12345"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Observações:
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Tanque cheio; calibragem de pneus realizada..."
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
              {saving ? 'Gravando...' : editingLog ? 'Atualizar Abastecimento' : 'Salvar Abastecimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
