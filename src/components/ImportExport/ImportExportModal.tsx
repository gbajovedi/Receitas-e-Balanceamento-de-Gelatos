import React, { useState, useRef } from 'react';
import { db } from '../../db/database';
import { Download, Upload, RotateCcw, X, CheckCircle, AlertTriangle } from 'lucide-react';

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
      setStatusMessage({ text: 'Backup exportado com sucesso!', type: 'success' });
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
      setStatusMessage({
        text: `Importação concluída! ${result.recipesCount} receitas e ${result.ingredientsCount} insumos carregados.`,
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
        'Tem certeza que deseja restaurar os dados de fábrica? Todas as receitas personalizadas e custos editados serão restaurados para a versão inicial da planilha.'
      )
    ) {
      try {
        setLoading(true);
        await db.restoreFactoryDefaults();
        setStatusMessage({
          text: 'Banco restaurado com sucesso para os 177 gelatos e 190 insumos originais!',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>💾</span>
            <span>Importar & Exportar Dados</span>
          </h3>
          <p className="text-xs text-slate-400">
            Gerencie backups, exporte suas receitas ou restaure a biblioteca padrão da planilha.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Export Box */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Exportar Backup Completo</h4>
              <p className="text-xs text-slate-400">
                Gera um arquivo JSON contendo todas as receitas, insumos e custos.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleExport}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              <Download className="w-4 h-4" />
              <span>Exportar (.JSON)</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-white">Importar Backup ou Receitas</h4>
              <p className="text-xs text-slate-400">
                Carregue um arquivo JSON gerado anteriormente neste ou em outro dispositivo.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="text-amber-500 focus:ring-0"
                />
                <span>Mesclar (Manter existentes)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-amber-500 focus:ring-0"
                />
                <span>Substituir tudo</span>
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
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Selecionar Arquivo .JSON para Importar</span>
            </button>
          </div>

          {/* Restore Factory Box */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-300">Restaurar Versão de Fábrica</h4>
              <p className="text-[11px] text-slate-500">
                Volta o banco aos 177 gelatos e 190 insumos originais da planilha.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleRestoreFactory}
              className="px-3 py-1.5 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

