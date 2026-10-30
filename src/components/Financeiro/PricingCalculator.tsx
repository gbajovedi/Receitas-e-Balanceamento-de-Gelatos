import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  RotateCcw,
  Landmark,
  CreditCard,
  Receipt,
  PieChart,
  Sparkles,
  Zap,
  Building2,
  Users,
  Snowflake,
  ShieldCheck
} from 'lucide-react';
import {
  getStoredPricingParams,
  saveStoredPricingParams,
  DEFAULT_PRICING_PARAMS,
  CIELO_PRESETS,
  calculateEffectiveCardFee,
  PricingParams
} from '../../core/pricingStorage';

export const PricingCalculator: React.FC = () => {
  const initial = getStoredPricingParams();

  // 1. Ocupação & Utilidades
  const [rent, setRent] = useState<number>(initial.rent);
  const [electricity, setElectricity] = useState<number>(initial.electricity);
  const [water, setWater] = useState<number>(initial.water);
  const [telecom, setTelecom] = useState<number>(initial.telecom);

  // 2. Pessoal & Gestão
  const [payroll, setPayroll] = useState<number>(initial.payroll);
  const [ownerSalary, setOwnerSalary] = useState<number>(initial.ownerSalary ?? 0);
  const [accounting, setAccounting] = useState<number>(initial.accounting);
  const [software, setSoftware] = useState<number>(initial.software);

  // 3. Refrigeração, Máquinas & Sanitização
  const [equipmentMaintenance, setEquipmentMaintenance] = useState<number>(
    initial.equipmentMaintenance ?? 250
  );
  const [equipmentDepreciation, setEquipmentDepreciation] = useState<number>(
    initial.equipmentDepreciation ?? 350
  );
  const [cleaningHygiene, setCleaningHygiene] = useState<number>(initial.cleaningHygiene ?? 150);
  const [secPackaging, setSecPackaging] = useState<number>(initial.secPackaging);

  // 4. Tributos, Licenças & Proteção
  const [fixedTaxes, setFixedTaxes] = useState<number>(initial.fixedTaxes);
  const [licensesAndPermits, setLicensesAndPermits] = useState<number>(
    initial.licensesAndPermits ?? 100
  );
  const [commercialInsurance, setCommercialInsurance] = useState<number>(
    initial.commercialInsurance ?? 0
  );
  const [posRentalMonthly, setPosRentalMonthly] = useState<number>(initial.posRentalMonthly ?? 0);
  const [marketing, setMarketing] = useState<number>(initial.marketing);

  // Produção e Pote
  const [monthlyUnits, setMonthlyUnits] = useState<number>(initial.monthlyUnits);
  const [tubWeightGrams, setTubWeightGrams] = useState<number>(initial.tubWeightGrams);
  const [tubPackCost, setTubPackCost] = useState<number>(initial.tubPackCost);
  const [targetMargin, setTargetMargin] = useState<number>(initial.targetMargin);
  const [salesTaxPercent, setSalesTaxPercent] = useState<number>(initial.salesTaxPercent);
  const [sampleCaldaCostKg, setSampleCaldaCostKg] = useState<number>(initial.sampleCaldaCostKg);

  // Configurações Maquininha Cielo / Adquirentes
  const [useSalesMix, setUseSalesMix] = useState<boolean>(initial.useSalesMix ?? true);
  const [cieloPlan, setCieloPlan] = useState<'padrao' | 'negociado' | 'fluxo' | 'custom'>(
    initial.cieloPlan ?? 'padrao'
  );
  const [cardFeePix, setCardFeePix] = useState<number>(initial.cardFeePix ?? 0.0);
  const [cardFeeDebit, setCardFeeDebit] = useState<number>(initial.cardFeeDebit ?? 1.49);
  const [cardFeeCreditSight, setCardFeeCreditSight] = useState<number>(initial.cardFeeCreditSight ?? 4.3);
  const [cardFeeCreditInstallment, setCardFeeCreditInstallment] = useState<number>(
    initial.cardFeeCreditInstallment ?? 9.9
  );

  // Mix de Vendas (% do faturamento no balcão)
  const [mixPix, setMixPix] = useState<number>(initial.mixPix ?? 30);
  const [mixDebit, setMixDebit] = useState<number>(initial.mixDebit ?? 45);
  const [mixCreditSight, setMixCreditSight] = useState<number>(initial.mixCreditSight ?? 20);
  const [mixCreditInstallment, setMixCreditInstallment] = useState<number>(initial.mixCreditInstallment ?? 5);

  // Taxa manual (modo simples)
  const [cardFeeManual, setCardFeeManual] = useState<number>(initial.cardFee ?? 2.03);

  // Objeto unificado para persistência e cálculos
  const currentParams: PricingParams = {
    rent,
    electricity,
    water,
    telecom,
    payroll,
    ownerSalary,
    accounting,
    software,
    equipmentMaintenance,
    equipmentDepreciation,
    cleaningHygiene,
    secPackaging,
    fixedTaxes,
    licensesAndPermits,
    commercialInsurance,
    posRentalMonthly,
    marketing,
    monthlyUnits,
    tubWeightGrams,
    tubPackCost,
    targetMargin,
    cardFee: cardFeeManual,
    useSalesMix,
    cieloPlan,
    cardFeePix,
    cardFeeDebit,
    cardFeeCreditSight,
    cardFeeCreditInstallment,
    mixPix,
    mixDebit,
    mixCreditSight,
    mixCreditInstallment,
    salesTaxPercent,
    sampleCaldaCostKg
  };

  const effectiveCardFee = calculateEffectiveCardFee(currentParams);
  const totalMixSum = mixPix + mixDebit + mixCreditSight + mixCreditInstallment;

  // Persistência automática no localStorage
  useEffect(() => {
    saveStoredPricingParams(currentParams);
  }, [
    rent,
    electricity,
    water,
    telecom,
    payroll,
    ownerSalary,
    accounting,
    software,
    equipmentMaintenance,
    equipmentDepreciation,
    cleaningHygiene,
    secPackaging,
    fixedTaxes,
    licensesAndPermits,
    commercialInsurance,
    posRentalMonthly,
    marketing,
    monthlyUnits,
    tubWeightGrams,
    tubPackCost,
    targetMargin,
    cardFeeManual,
    useSalesMix,
    cieloPlan,
    cardFeePix,
    cardFeeDebit,
    cardFeeCreditSight,
    cardFeeCreditInstallment,
    mixPix,
    mixDebit,
    mixCreditSight,
    mixCreditInstallment,
    salesTaxPercent,
    sampleCaldaCostKg
  ]);

  // Aplicar Preset Cielo
  const applyCieloPreset = (plan: 'padrao' | 'negociado' | 'fluxo') => {
    const p = CIELO_PRESETS[plan];
    setCieloPlan(plan);
    setCardFeePix(p.cardFeePix);
    setCardFeeDebit(p.cardFeeDebit);
    setCardFeeCreditSight(p.cardFeeCreditSight);
    setCardFeeCreditInstallment(p.cardFeeCreditInstallment);
    setPosRentalMonthly(p.posRentalMonthly);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Deseja restaurar todos os custos fixos para os padrões recomendados da gelateria?')) {
      const def = DEFAULT_PRICING_PARAMS;
      setRent(def.rent);
      setElectricity(def.electricity);
      setWater(def.water);
      setTelecom(def.telecom);
      setPayroll(def.payroll);
      setOwnerSalary(def.ownerSalary);
      setAccounting(def.accounting);
      setSoftware(def.software);
      setEquipmentMaintenance(def.equipmentMaintenance);
      setEquipmentDepreciation(def.equipmentDepreciation);
      setCleaningHygiene(def.cleaningHygiene);
      setSecPackaging(def.secPackaging);
      setFixedTaxes(def.fixedTaxes);
      setLicensesAndPermits(def.licensesAndPermits);
      setCommercialInsurance(def.commercialInsurance);
      setPosRentalMonthly(def.posRentalMonthly);
      setMarketing(def.marketing);
      setMonthlyUnits(def.monthlyUnits);
      setTubWeightGrams(def.tubWeightGrams);
      setTubPackCost(def.tubPackCost);
      setTargetMargin(def.targetMargin);
      setCardFeeManual(def.cardFee);
      setUseSalesMix(def.useSalesMix);
      setCieloPlan(def.cieloPlan);
      setCardFeePix(def.cardFeePix);
      setCardFeeDebit(def.cardFeeDebit);
      setCardFeeCreditSight(def.cardFeeCreditSight);
      setCardFeeCreditInstallment(def.cardFeeCreditInstallment);
      setMixPix(def.mixPix);
      setMixDebit(def.mixDebit);
      setMixCreditSight(def.mixCreditSight);
      setMixCreditInstallment(def.mixCreditInstallment);
      setSalesTaxPercent(def.salesTaxPercent);
      setSampleCaldaCostKg(def.sampleCaldaCostKg);
      saveStoredPricingParams(def);
    }
  };

  // Subtotais por Grupo Lógico
  const subtotalOccupancy = rent + electricity + water + telecom;
  const subtotalPersonnel = payroll + ownerSalary + accounting + software;
  const subtotalEquipment = equipmentMaintenance + equipmentDepreciation + cleaningHygiene + secPackaging;
  const subtotalLegal = fixedTaxes + licensesAndPermits + commercialInsurance + posRentalMonthly + marketing;

  const totalFixedCosts = subtotalOccupancy + subtotalPersonnel + subtotalEquipment + subtotalLegal;
  const overheadPerUnit = monthlyUnits > 0 ? totalFixedCosts / monthlyUnits : 0;

  // Cálculos do Pote e Markup
  const activeFeePercent = useSalesMix ? effectiveCardFee : cardFeeManual;
  const productCostInTub = sampleCaldaCostKg * (tubWeightGrams / 1000);
  const directCostPerTub = productCostInTub + tubPackCost;
  const totalCostWithOverhead = directCostPerTub + overheadPerUnit;

  const totalSalesDeductionsPercent = activeFeePercent + salesTaxPercent;
  const marginDivisor = (1 - targetMargin / 100) * (1 - totalSalesDeductionsPercent / 100);

  const suggestedTubPrice =
    marginDivisor > 0 && totalSalesDeductionsPercent < 100
      ? totalCostWithOverhead / marginDivisor
      : 0;

  const cardFeeValue = suggestedTubPrice * (activeFeePercent / 100);
  const taxValue = suggestedTubPrice * (salesTaxPercent / 100);
  const netProfit = suggestedTubPrice - cardFeeValue - taxValue - totalCostWithOverhead;

  // Comparativo por Modalidade para o mesmo pote
  const paymentScenarios = [
    {
      name: 'Pix',
      rate: cardFeePix,
      color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
      badge: 'bg-emerald-500/20 text-emerald-300'
    },
    {
      name: 'Débito',
      rate: cardFeeDebit,
      color: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10',
      badge: 'bg-cyan-500/20 text-cyan-300'
    },
    {
      name: 'Crédito 1x',
      rate: cardFeeCreditSight,
      color: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
      badge: 'bg-amber-500/20 text-amber-300'
    },
    {
      name: 'Parcelado',
      rate: cardFeeCreditInstallment,
      color: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
      badge: 'bg-rose-500/20 text-rose-300'
    }
  ].map(s => {
    const feeVal = suggestedTubPrice * (s.rate / 100);
    const profit = suggestedTubPrice - taxValue - feeVal - totalCostWithOverhead;
    const marginPct =
      suggestedTubPrice - taxValue - feeVal > 0
        ? (profit / (suggestedTubPrice - taxValue - feeVal)) * 100
        : 0;
    return {
      ...s,
      feeVal,
      profit,
      marginPct
    };
  });

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
            Simulador de rateio fixo avançado para gelaterias, taxas Cielo (Pix/Débito/Crédito) e markup de venda.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetToDefaults}
          className="self-start sm:self-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
          title="Restaurar valores iniciais recomendados"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Restaurar Padrões</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Custos Fixos Mensais com 4 Grupos Temáticos */}
        <div className="lg:col-span-6 bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">Custos Fixos Mensais (Rateio)</h3>
            </div>
            <span className="text-sm font-mono font-black text-amber-300">
              Total: R$ {totalFixedCosts.toFixed(2)}/mês
            </span>
          </div>

          {/* 1. GRUPO: OCUPAÇÃO & UTILIDADES */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                1. Ocupação & Utilidades
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                R$ {subtotalOccupancy.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Aluguel do Espaço:</label>
                <input
                  type="number"
                  min="0"
                  value={rent || ''}
                  onChange={e => setRent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Energia Elétrica (Freezers 24h):</label>
                <input
                  type="number"
                  min="0"
                  value={electricity || ''}
                  onChange={e => setElectricity(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Água & Esgoto:</label>
                <input
                  type="number"
                  min="0"
                  value={water || ''}
                  onChange={e => setWater(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Internet & Telecom:</label>
                <input
                  type="number"
                  min="0"
                  value={telecom || ''}
                  onChange={e => setTelecom(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* 2. GRUPO: PESSOAL & GESTÃO */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                2. Pessoal & Gestão
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                R$ {subtotalPersonnel.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Folha da Equipe (CLT/Extra):</label>
                <input
                  type="number"
                  min="0"
                  value={payroll || ''}
                  onChange={e => setPayroll(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-cyan-300 font-bold block">Pró-Labore (Gelatiere):</label>
                  <span className="text-[9px] text-cyan-400 font-semibold bg-cyan-950/60 px-1 rounded">Dono</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={ownerSalary || ''}
                  onChange={e => setOwnerSalary(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-cyan-500/50 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="Ex: 2500.00"
                  title="Salário mensal retirado pelo dono/mestre gelatiere"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Contabilidade & Honorários:</label>
                <input
                  type="number"
                  min="0"
                  value={accounting || ''}
                  onChange={e => setAccounting(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Software, PDV & Cardápio:</label>
                <input
                  type="number"
                  min="0"
                  value={software || ''}
                  onChange={e => setSoftware(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* 3. GRUPO: REFRIGERAÇÃO, MÁQUINAS & SANITIZAÇÃO */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Snowflake className="w-3.5 h-3.5 text-emerald-400" />
                3. Refrigeração, Máquinas & Sanitização
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                R$ {subtotalEquipment.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Manutenção preventiva de compressores, gás e filtros">
                  Manutenção Refrigeração:
                </label>
                <input
                  type="number"
                  min="0"
                  value={equipmentMaintenance || ''}
                  onChange={e => setEquipmentMaintenance(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="Ex: 250.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Fundo mensal para substituição futura de mantecadora e pasteurizador">
                  Depreciação de Maquinário:
                </label>
                <input
                  type="number"
                  min="0"
                  value={equipmentDepreciation || ''}
                  onChange={e => setEquipmentDepreciation(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="Ex: 350.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Químicos CIP, sanitizantes de pasteurizadora, álcool 70% e luvas">
                  Higiene & Sanitizantes CIP:
                </label>
                <input
                  type="number"
                  min="0"
                  value={cleaningHygiene || ''}
                  onChange={e => setCleaningHygiene(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="Ex: 150.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Sacolas, guardanapos, colherinhas descartáveis">
                  Embalagens Secundárias:
                </label>
                <input
                  type="number"
                  min="0"
                  value={secPackaging || ''}
                  onChange={e => setSecPackaging(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* 4. GRUPO: TRIBUTOS, LICENÇAS & PROTEÇÃO */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                4. Tributos, Licenças & Proteção
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                R$ {subtotalLegal.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-amber-300 font-bold block mb-0.5">Impostos Fixos (DAS MEI):</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={fixedTaxes || ''}
                  onChange={e => setFixedTaxes(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="Ex: 75.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Alvará, laudo dos bombeiros, dedetização trimestral rateada e RT">
                  Alvarás, Laudos & RT:
                </label>
                <input
                  type="number"
                  min="0"
                  value={licensesAndPermits || ''}
                  onChange={e => setLicensesAndPermits(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="Ex: 100.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5" title="Seguro contra queima de compressores e perda de caldas congeladas">
                  Seguro / Perda de Estoque:
                </label>
                <input
                  type="number"
                  min="0"
                  value={commercialInsurance || ''}
                  onChange={e => setCommercialInsurance(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">Marketing & Redes Sociais:</label>
                <input
                  type="number"
                  min="0"
                  value={marketing || ''}
                  onChange={e => setMarketing(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
              <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400 text-[11px]">Aluguel Maquininha (R$/mês):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                  min="0"
                    step="10"
                    value={posRentalMonthly || ''}
                    onChange={e => setPosRentalMonthly(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white font-mono font-bold text-right"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={() => setPosRentalMonthly(posRentalMonthly > 0 ? 0 : 99.9)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded font-semibold"
                  >
                    {posRentalMonthly > 0 ? 'Isento' : 'R$ 99,90'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Volume de Produção & Rateio Unitário */}
          <div className="pt-3.5 border-t border-slate-700 flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-slate-300 block">Produção / Venda Mensal (Unidades ou Potes):</label>
              <input
                type="number"
                  min="0"
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

        {/* Right Column: Markup, Cielo Terminals & Pricing */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
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
                  min="0"
                  step="0.5"
                  value={sampleCaldaCostKg || ''}
                  onChange={e => setSampleCaldaCostKg(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-black"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Peso do Pote (g):</label>
                <input
                  type="number"
                  min="0"
                  value={tubWeightGrams || ''}
                  onChange={e => setTubWeightGrams(parseFloat(e.target.value) || 500)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Embalagem Direta (R$):</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={tubPackCost || ''}
                  onChange={e => setTubPackCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Margem Desejada (%):</label>
                <input
                  type="number"
                  min="0"
                  value={targetMargin || ''}
                  onChange={e => setTargetMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-black text-amber-300"
                />
              </div>
            </div>

            {/* MÓDULO MAQUININHA CIELO / MEIOS DE PAGAMENTO */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-emerald-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      Maquininha & Taxas de Pagamento (Modelo Cielo)
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Configure as taxas reais da sua maquininha e o mix do balcão
                    </span>
                  </div>
                </div>

                {/* Alternância de Modo (Ponderado vs Manual) */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setUseSalesMix(true)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      useSalesMix
                        ? 'bg-emerald-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mix Ponderado
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseSalesMix(false)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      !useSalesMix
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Taxa Manual
                  </button>
                </div>
              </div>

              {/* Botões de Presets da Cielo */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Planos Cielo:
                </span>
                <button
                  type="button"
                  onClick={() => applyCieloPreset('padrao')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    cieloPlan === 'padrao'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                  }`}
                  title={CIELO_PRESETS.padrao.description}
                >
                  ⭐ Cielo D+1 Padrão
                </button>
                <button
                  type="button"
                  onClick={() => applyCieloPreset('negociado')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    cieloPlan === 'negociado'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                  }`}
                  title={CIELO_PRESETS.negociado.description}
                >
                  💼 Negociado (&gt;15k)
                </button>
                <button
                  type="button"
                  onClick={() => applyCieloPreset('fluxo')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    cieloPlan === 'fluxo'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                  }`}
                  title={CIELO_PRESETS.fluxo.description}
                >
                  ⏱️ D+30 (No Fluxo)
                </button>
              </div>

              {useSalesMix ? (
                <div className="space-y-3 pt-1">
                  {/* Grid das 4 modalidades Cielo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {/* 1. Pix */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-400">Pix</span>
                        <span className="text-[10px] text-slate-400">Na conta</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Taxa (%):</span>
                        <input
                          type="number"
                  min="0"
                          step="0.05"
                          value={cardFeePix}
                          onChange={e => {
                            setCardFeePix(Math.max(0, parseFloat(e.target.value) || 0));
                            setCieloPlan('custom');
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">% no Balcão:</span>
                        <input
                          type="number"
                  min="0"
                          value={mixPix}
                          onChange={e => setMixPix(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-emerald-300"
                        />
                      </div>
                    </div>

                    {/* 2. Débito */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-cyan-400">Débito</span>
                        <span className="text-[10px] text-slate-400">D+1</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Taxa (%):</span>
                        <input
                          type="number"
                  min="0"
                          step="0.05"
                          value={cardFeeDebit}
                          onChange={e => {
                            setCardFeeDebit(Math.max(0, parseFloat(e.target.value) || 0));
                            setCieloPlan('custom');
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">% no Balcão:</span>
                        <input
                          type="number"
                  min="0"
                          value={mixDebit}
                          onChange={e => setMixDebit(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-cyan-300"
                        />
                      </div>
                    </div>

                    {/* 3. Crédito à Vista */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-400">Crédito 1x</span>
                        <span className="text-[10px] text-slate-400">À Vista</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Taxa (%):</span>
                        <input
                          type="number"
                  min="0"
                          step="0.05"
                          value={cardFeeCreditSight}
                          onChange={e => {
                            setCardFeeCreditSight(Math.max(0, parseFloat(e.target.value) || 0));
                            setCieloPlan('custom');
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">% no Balcão:</span>
                        <input
                          type="number"
                  min="0"
                          value={mixCreditSight}
                          onChange={e => setMixCreditSight(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-amber-300"
                        />
                      </div>
                    </div>

                    {/* 4. Crédito Parcelado */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-rose-400">Parcelado</span>
                        <span className="text-[10px] text-slate-400">2x-6x</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Taxa (%):</span>
                        <input
                          type="number"
                  min="0"
                          step="0.1"
                          value={cardFeeCreditInstallment}
                          onChange={e => {
                            setCardFeeCreditInstallment(Math.max(0, parseFloat(e.target.value) || 0));
                            setCieloPlan('custom');
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">% no Balcão:</span>
                        <input
                          type="number"
                  min="0"
                          value={mixCreditInstallment}
                          onChange={e => setMixCreditInstallment(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm font-mono font-bold text-rose-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Barra Visual do Mix de Vendas */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <PieChart className="w-3 h-3 text-slate-400" />
                        Composição das Vendas (Total: {totalMixSum}%):
                      </span>
                      <span className="text-white font-mono font-bold">
                        Pix {mixPix}% | Déb {mixDebit}% | Créd {mixCreditSight}% | Parc {mixCreditInstallment}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
                      <div style={{ width: `${mixPix}%` }} className="bg-emerald-500 h-full" title={`Pix: ${mixPix}%`} />
                      <div style={{ width: `${mixDebit}%` }} className="bg-cyan-500 h-full" title={`Débito: ${mixDebit}%`} />
                      <div style={{ width: `${mixCreditSight}%` }} className="bg-amber-500 h-full" title={`Crédito: ${mixCreditSight}%`} />
                      <div style={{ width: `${mixCreditInstallment}%` }} className="bg-rose-500 h-full" title={`Parcelado: ${mixCreditInstallment}%`} />
                    </div>
                  </div>

                  {/* Destaque da Taxa Média Efetiva */}
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-300 block">
                        Taxa Média Efetiva da Maquininha:
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Ponderada pelo seu volume real de Pix, Débito e Crédito
                      </span>
                    </div>
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {effectiveCardFee.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ) : (
                /* Modo Taxa Manual Única */
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <label className="text-white font-bold block text-xs">Taxa Única Fixa de Venda (%):</label>
                    <span className="text-[11px] text-slate-400">Informe uma taxa média única para todas as vendas.</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                  min="0"
                      step="0.1"
                      value={cardFeeManual}
                      onChange={e => setCardFeeManual(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-28 bg-slate-950 border border-amber-500/60 rounded-lg p-1.5 text-sm font-mono font-bold text-amber-300 text-right pr-6"
                    />
                    <span className="absolute right-2 top-2 text-slate-500 font-bold text-xs">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Impostos sobre a Venda */}
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-white font-bold block text-xs sm:text-sm flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-cyan-400" />
                    <span>Impostos sobre Venda (% do Faturamento):</span>
                  </label>
                  <span className="text-[11px] text-slate-400 block">
                    Alíquota do Simples Nacional ou regime tributário (se MEI, use 0%).
                  </span>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="90"
                      value={salesTaxPercent || ''}
                      onChange={e => setSalesTaxPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-28 bg-slate-950 border-2 border-cyan-500/60 focus:border-cyan-400 focus:outline-none rounded-lg pl-3 pr-6 py-1.5 text-sm text-cyan-300 font-mono font-black text-right"
                      placeholder="0.0"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-500 font-bold text-xs pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              {/* Botões de Atalhos Rápidos Impostos */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Atalhos:</span>
                {[
                  { label: 'MEI (0%)', val: 0 },
                  { label: 'Simples Comércio 4.0%', val: 4.0 },
                  { label: 'Simples Indústria 4.5%', val: 4.5 },
                  { label: 'Simples Faixa 2 (6.8%)', val: 6.8 },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setSalesTaxPercent(p.val)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      salesTaxPercent === p.val
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 active:scale-95'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Demonstrativo de Custos do Pote */}
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700 space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Custo do Gelato ({tubWeightGrams}g):</span>
                <span className="font-mono font-bold">R$ {productCostInTub.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Custo Direto (Gelato + Embalagem):</span>
                <span className="font-mono font-bold">R$ {directCostPerTub.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Custo Fixo Rateado (17 categorias):</span>
                <span className="font-mono font-bold">R$ {overheadPerUnit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-white pt-2 border-t border-slate-800 text-base">
                <span>Custo Total do Pote com Rateio:</span>
                <span className="font-mono text-amber-300">R$ {totalCostWithOverhead.toFixed(2)}</span>
              </div>
            </div>

            {/* Preço de Venda Sugerido */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/50 rounded-xl space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Preço de Venda Sugerido (Pote {tubWeightGrams}g):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40">
                    Taxa Efetiva: {activeFeePercent.toFixed(2)}%
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40">
                    Imposto: {salesTaxPercent}%
                  </span>
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                R$ {suggestedTubPrice.toFixed(2)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300 pt-2.5 border-t border-emerald-900/60 font-medium">
                <div>
                  <span className="text-slate-400 block text-[11px]">Taxa Média Maquininha:</span>
                  <strong className="font-mono text-slate-200">R$ {cardFeeValue.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Imposto s/ Venda:</span>
                  <strong className="font-mono text-cyan-300">R$ {taxValue.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Lucro Líquido Real:</span>
                  <strong className="font-mono text-emerald-300 font-black">R$ {netProfit.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* MATRIZ COMPARATIVA DE LUCRO POR MEIO DE PAGAMENTO */}
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Comparativo de Lucro por Meio de Pagamento
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Para o Pote a R$ {suggestedTubPrice.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Veja quanto sobra líquido no caixa conforme a forma como o cliente paga o mesmo gelato:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {paymentScenarios.map(s => (
                <div key={s.name} className={`p-3 rounded-xl border ${s.color} space-y-1.5 flex flex-col justify-between`}>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-white text-xs">{s.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${s.badge}`}>
                        {s.rate}%
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      Taxa: <strong className="font-mono text-slate-200">R$ {s.feeVal.toFixed(2)}</strong>
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Lucro no Caixa:</span>
                    <span className="text-base font-black font-mono text-white block">
                      R$ {s.profit.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold block">
                      Margem: {s.marginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
              <span className="text-base">💡</span>
              <div>
                <strong className="text-amber-300 block mb-0.5">Estratégia de Desconto no Pix:</strong>
                Ao vender no Pix você economiza{' '}
                <strong className="text-emerald-300 font-mono">
                  R$ {(paymentScenarios[2].feeVal - paymentScenarios[0].feeVal).toFixed(2)}
                </strong>{' '}
                por pote em comparação com o cartão de crédito 1x. Você pode conceder esse valor como desconto à vista sem reduzir seu lucro planejado!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
