import React, { useState, useEffect } from 'react';
import { DollarSign, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'gelato_pricing_params_v1';

export const PricingCalculator: React.FC = () => {
  // Load initial params from localStorage or spreadsheet defaults
  const loadSaved = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved pricing params:', e);
    }
    return null;
  };

  const initial = loadSaved();

  // Overhead parameters based on sheet "Conversor Custo K|G"
  const [rent, setRent] = useState<number>(initial?.rent ?? 0);
  const [electricity, setElectricity] = useState<number>(initial?.electricity ?? 100);
  const [water, setWater] = useState<number>(initial?.water ?? 150);
  const [payroll, setPayroll] = useState<number>(initial?.payroll ?? 2000);
  const [accounting, setAccounting] = useState<number>(initial?.accounting ?? 350);
  const [software, setSoftware] = useState<number>(initial?.software ?? 100);
  const [secPackaging, setSecPackaging] = useState<number>(initial?.secPackaging ?? 200);
  const [marketing, setMarketing] = useState<number>(initial?.marketing ?? 500);
  const [telecom, setTelecom] = useState<number>(initial?.telecom ?? 120);

  const [monthlyUnits, setMonthlyUnits] = useState<number>(initial?.monthlyUnits ?? 4000);
  const [tubWeightGrams, setTubWeightGrams] = useState<number>(initial?.tubWeightGrams ?? 500);
  const [tubPackCost, setTubPackCost] = useState<number>(initial?.tubPackCost ?? 1.50);
  const [targetMargin, setTargetMargin] = useState<number>(initial?.targetMargin ?? 40);
  const [cardFee, setCardFee] = useState<number>(initial?.cardFee ?? 3.5);

  // Simulation test product
  const [sampleCaldaCostKg, setSampleCaldaCostKg] = useState<number>(initial?.sampleCaldaCostKg ?? 15.00);

  // Persist to localStorage whenever parameters change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          rent,
          electricity,
          water,
          payroll,
          accounting,
          software,
          secPackaging,
          marketing,
          telecom,
          monthlyUnits,
          tubWeightGrams,
          tubPackCost,
          targetMargin,
          cardFee,
          sampleCaldaCostKg
        })
      );
    } catch (e) {
      console.warn('Failed to save pricing params:', e);
    }
  }, [
    rent,
    electricity,
    water,
    payroll,
    accounting,
    software,
    secPackaging,
    marketing,
    telecom,
    monthlyUnits,
    tubWeightGrams,
    tubPackCost,
    targetMargin,
    cardFee,
    sampleCaldaCostKg
  ]);

  const handleResetToDefaults = () => {
    if (window.confirm('Deseja restaurar todos os valores para os padrões da planilha?')) {
      setRent(0);
      setElectricity(100);
      setWater(150);
      setPayroll(2000);
      setAccounting(350);
      setSoftware(100);
      setSecPackaging(200);
      setMarketing(500);
      setTelecom(120);
      setMonthlyUnits(4000);
      setTubWeightGrams(500);
      setTubPackCost(1.50);
      setTargetMargin(40);
      setCardFee(3.5);
      setSampleCaldaCostKg(15.00);
    }
  };

  const totalFixedCosts =
    rent + electricity + water + payroll + accounting + software + secPackaging + marketing + telecom;

  const overheadPerUnit = monthlyUnits > 0 ? totalFixedCosts / monthlyUnits : 0;

  // Tub calculation
  const productCostInTub = sampleCaldaCostKg * (tubWeightGrams / 1000);
  const directCostPerTub = productCostInTub + tubPackCost;
  const totalCostWithOverhead = directCostPerTub + overheadPerUnit;
  const marginDivisor = (1 - targetMargin / 100) * (1 - cardFee / 100);
  const suggestedTubPrice = marginDivisor > 0 ? totalCostWithOverhead / marginDivisor : 0;
  const cardFeeValue = suggestedTubPrice * (cardFee / 100);
  const netProfit = suggestedTubPrice - cardFeeValue - totalCostWithOverhead;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>Gestão Financeira & Engenharia de Preços</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Simulador de rateio de custos fixos, markup por margem líquida e precificação de potes e porções.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetToDefaults}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          title="Restaurar valores iniciais da planilha"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Restaurar Padrões</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Fixed Costs Breakdown */}
        <div className="lg:col-span-6 bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-base font-bold text-white">Custos Fixos Mensais (Rateio)</h3>
            <span className="text-sm font-mono font-black text-amber-300">
              Total: R$ {totalFixedCosts.toFixed(2)}/mês
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Aluguel do Espaço:</label>
              <input
                type="number"
                value={rent || ''}
                onChange={e => setRent(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Energia Elétrica:</label>
              <input
                type="number"
                value={electricity || ''}
                onChange={e => setElectricity(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Água:</label>
              <input
                type="number"
                value={water || ''}
                onChange={e => setWater(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Folha de Pagamento:</label>
              <input
                type="number"
                value={payroll || ''}
                onChange={e => setPayroll(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Contabilidade:</label>
              <input
                type="number"
                value={accounting || ''}
                onChange={e => setAccounting(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Software & Sistemas:</label>
              <input
                type="number"
                value={software || ''}
                onChange={e => setSoftware(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Marketing & Redes:</label>
              <input
                type="number"
                value={marketing || ''}
                onChange={e => setMarketing(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Embalagens Secundárias:</label>
              <input
                type="number"
                value={secPackaging || ''}
                onChange={e => setSecPackaging(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-semibold block mb-1">Internet & Telecom:</label>
              <input
                type="number"
                value={telecom || ''}
                onChange={e => setTelecom(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-700 flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-slate-300 block">Produção / Venda Mensal (Unidades ou Potes):</label>
              <input
                type="number"
                value={monthlyUnits || ''}
                onChange={e => setMonthlyUnits(parseFloat(e.target.value) || 1)}
                className="w-40 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold mt-1"
              />
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Rateio Fixo / Unidade:</span>
              <span className="text-xl font-black text-amber-300 font-mono">
                R$ {overheadPerUnit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Markup & Price Simulator */}
        <div className="lg:col-span-6 bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-base font-bold text-white">Simulador de Formação de Preço</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Fórmula de Markup
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Custo da Calda (R$/Kg):</label>
              <input
                type="number"
                step="0.5"
                value={sampleCaldaCostKg || ''}
                onChange={e => setSampleCaldaCostKg(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-black"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Peso do Pote (g):</label>
              <input
                type="number"
                value={tubWeightGrams || ''}
                onChange={e => setTubWeightGrams(parseFloat(e.target.value) || 500)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Embalagem Direta (R$):</label>
              <input
                type="number"
                step="0.1"
                value={tubPackCost || ''}
                onChange={e => setTubPackCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Margem Desejada (%):</label>
              <input
                type="number"
                value={targetMargin || ''}
                onChange={e => setTargetMargin(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono font-black text-amber-300"
              />
            </div>

            {/* Taxa de Cartão / Operadora / Venda Editável */}
            <div className="sm:col-span-2 bg-slate-900/80 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-white font-bold block text-xs sm:text-sm">
                    💳 Taxa de Cartão / Operadora (%):
                  </label>
                  <span className="text-[11px] text-slate-400 block">
                    Taxa média da maquininha de cartão ou canal de venda.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="90"
                      value={cardFee || ''}
                      onChange={e => setCardFee(parseFloat(e.target.value) || 0)}
                      className="w-28 bg-slate-950 border-2 border-emerald-500/60 focus:border-emerald-400 focus:outline-none rounded-lg pl-3 pr-6 py-1.5 text-base text-emerald-300 font-mono font-black text-right"
                      placeholder="0.0"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-500 font-bold text-xs pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              {/* Botões de Atalhos Rápidos */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Atalhos rápidos:</span>
                {[
                  { label: 'Débito 1.5%', val: 1.5 },
                  { label: 'Crédito 3.2%', val: 3.2 },
                  { label: 'Crédito 4.5%', val: 4.5 },
                  { label: 'Delivery/App 12%', val: 12 },
                  { label: '33% (Planilha)', val: 33 },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setCardFee(p.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      cardFee === p.val
                        ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20 font-black scale-105'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 active:scale-95'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700 space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Custo do Gelato no Pote:</span>
              <span className="font-mono font-bold">R$ {productCostInTub.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Custo Direto (Gelato + Embalagem):</span>
              <span className="font-mono font-bold">R$ {directCostPerTub.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Custo Indireto Rateado:</span>
              <span className="font-mono font-bold">R$ {overheadPerUnit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-white pt-2 border-t border-slate-800 text-base">
              <span>Custo Total do Pote:</span>
              <span className="font-mono text-amber-300">R$ {totalCostWithOverhead.toFixed(2)}</span>
            </div>
          </div>

          {/* Suggested Price Highlight */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/50 rounded-xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Preço de Venda Sugerido:
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40">
                Taxa Cartão: {cardFee}%
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
              R$ {suggestedTubPrice.toFixed(2)}
            </div>
            <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-emerald-900/60 font-medium">
              <span>Taxa Cartão / Venda: <strong className="font-mono">R$ {cardFeeValue.toFixed(2)}</strong></span>
              <span className="font-bold text-emerald-300">Lucro Líquido: <strong className="font-mono text-emerald-200">R$ {netProfit.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
