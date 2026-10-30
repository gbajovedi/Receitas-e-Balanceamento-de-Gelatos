import React, { useState, useRef } from 'react';
import { db } from '../../db/database';
import { Download, Upload, RotateCcw, X, CheckCircle, AlertTriangle, Database } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export full JSON
  const handleExport = async () => {
    try {
      setLoading(true);
      const json = await db.exportFullBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `gelato_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage({
        text: 'Backup exportado com sucesso! Inclui receitas, matérias-primas, pré-preparos e todos os custos fixos e taxas de precificação.',
        type: 'success'
      });
    } catch (err) {
      setStatusMessage({ text: 'Erro ao exportar backup: ' + err, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Import JSON file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const result = await db.importBackup(text, importMode);
      const extras: string[] = [];
      if (result.pricingImported) extras.push('parâmetros de precificação (custos fixos e taxas Cielo)');
      if (result.themeImported) extras.push('preferência de tema');
      const extraMsg = extras.length > 0 ? ` (incluindo ${extras.join(' e ')})` : '';

      setStatusMessage({
        text: `Importação concluída com sucesso! ${result.recipesCount} receitas e ${result.ingredientsCount} insumos carregados${extraMsg}.`,
        type: 'success'
      });
      onDataChanged();
    } catch (err) {
      setStatusMessage({ text: 'Erro ao importar arquivo: ' + err, type: 'error' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Restore factory defaults
  const handleRestoreFactory = async () => {
    if (
      confirm(
        'Tem certeza que deseja restaurar os dados de fábrica? Todas as receitas personalizadas, custos editados e parâmetros de precificação serão restaurados para a versão inicial da planilha.'
      )
    ) {
      try {
        setLoading(true);
        await db.restoreFactoryDefaults();
        setStatusMessage({
          text: 'Banco restaurado com sucesso para as 177 receitas, 190 insumos e parâmetros de precificação originais da planilha!',
          type: 'success'
        });
        onDataChanged();
      } catch (err) {
        setStatusMessage({ text: 'Erro ao restaurar: ' + err, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl relative space-y-5 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 shrink-0">
            💾
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Importar & Exportar Backup</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Faça backup completo, migre seus dados para outro dispositivo ou restaure a biblioteca da planilha.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Export Box */}
          <div className="bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-3.5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>Exportar Backup Completo</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Tudo Incluso
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Gera um arquivo <code className="font-mono text-amber-300 font-bold">.JSON</code> com 100% dos seus dados: receitas, insumos & custos, pré-preparos e <strong>todos os parâmetros de Precificação (custos fixos e taxas Cielo)</strong>.
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleExport}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 shrink-0 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Exportar (.JSON)</span>
              </button>
            </div>

            {/* Chips Informativos do Conteúdo do Backup */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mr-1">Incluso:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-750 text-slate-200 font-medium">
                🍨 Catálogo de Receitas
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-750 text-slate-200 font-medium">
                🧪 Insumos & Custos/kg
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-750 text-slate-200 font-medium">
                👨‍🍳 Pré-preparos & Variegatos
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 font-bold flex items-center gap-1">
                <span>💰</span>
                <span>Custos Fixos & Taxas de Precificação</span>
              </span>
            </div>
          </div>

          {/* Import Box */}
          <div className="bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-3.5 shadow-md">
            <div>
              <h4 className="text-sm sm:text-base font-black text-white">Importar Backup ou Restaurar Dados</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Carregue um arquivo <code className="font-mono text-amber-300 font-bold">.JSON</code> gerado anteriormente para restaurar receitas, custos de matérias-primas e <strong>suas configurações de precificação financeira</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-750">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="text-amber-500 focus:ring-0"
                />
                <span>Mesclar (Preservar dados existentes)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-amber-500 focus:ring-0"
                />
                <span>Substituir tudo (Limpar e sobrescrever)</span>
              </label>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Selecionar Arquivo .JSON de Backup</span>
            </button>
          </div>

          {/* Restore Factory Box */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-300">Restaurar Versão de Fábrica</h4>
              <p className="text-[11px] text-slate-400">
                Restaura o banco aos 177 gelatos, 190 insumos e parâmetros de precificação originais da planilha.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleRestoreFactory}
              className="px-3.5 py-2 border border-slate-700 hover:border-rose-500/50 bg-slate-800/80 hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
