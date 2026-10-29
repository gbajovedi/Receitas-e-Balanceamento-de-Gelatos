import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

export const PricingCalculator: React.FC = () => {
  // Overhead parameters based on sheet "Conversor Custo K|G"
  const [rent, setRent] = useState<number>(0);
  const [electricity, setElectricity] = useState<number>(100);
  const [water, setWater] = useState<number>(150);
  const [payroll, setPayroll] = useState<number>(2000);
  const [accounting, setAccounting] = useState<number>(350);
  const [software, setSoftware] = useState<number>(100);
  const [secPackaging, setSecPackaging] = useState<number>(200);
  const [marketing, setMarketing] = useState<number>(500);
  const [telecom, setTelecom] = useState<number>(120);

  const [monthlyUnits, setMonthlyUnits] = useState<number>(4000);
  const [tubWeightGrams, setTubWeightGrams] = useState<number>(500);
  const [tubPackCost, setTubPackCost] = useState<number>(1.50);
  const [targetMargin, setTargetMargin] = useState<number>(40);
  const [cardFee, setCardFee] = useState<number>(33);

  // Simulation test product
  const [sampleCaldaCostKg, setSampleCaldaCostKg] = useState<number>(15.00);

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
      <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-5 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <DollarSign className="w-6 h-6 text-emerald-400" />
          <span>Gestão Financeira & Engenharia de Preços</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
          Simulador de rateio de custos fixos, markup por margem líquida e precificação de potes e porções.
        </p>
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

          <div className="grid grid-cols-2 gap-3.5 text-xs">
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
