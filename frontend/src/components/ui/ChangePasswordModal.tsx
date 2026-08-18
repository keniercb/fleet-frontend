import { useState } from 'react';
import Modal from './Modal';
import { authApi } from '@/api/endpoints';
import { useToast } from '@/contexts/ToastContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  userId: number;
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ userId, open, onClose }: ChangePasswordModalProps) {
  const { addToast } = useToast();
  const [passwordAnterior, setPasswordAnterior] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmacionPassword, setConfirmacionPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmacion: false,
  });

  const resetForm = () => {
    setPasswordAnterior('');
    setNuevaPassword('');
    setConfirmacionPassword('');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordAnterior.trim() || !nuevaPassword.trim() || !confirmacionPassword.trim()) {
      addToast({ type: 'warning', title: 'Campos requeridos', message: 'Todos los campos son obligatorios.' });
      return;
    }

    if (nuevaPassword !== confirmacionPassword) {
      addToast({ type: 'error', title: 'Error', message: 'La nueva contraseña y la confirmación no coinciden.' });
      return;
    }

    if (nuevaPassword.length < 4) {
      addToast({ type: 'warning', title: 'Contraseña débil', message: 'La nueva contraseña debe tener al menos 4 caracteres.' });
      return;
    }

    setLoading(true);
    try {
      await authApi.cambiarPassword({
        userId,
        passwordAnterior,
        nuevaPassword,
        confirmacionPassword,
      });
      addToast({ type: 'success', title: 'Contraseña actualizada', message: 'Su contraseña ha sido cambiada exitosamente.' });
      resetForm();
      onClose();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.';
      addToast({ type: 'error', title: 'Error al cambiar contraseña', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="Cambiar Contraseña" onClose={handleClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contraseña actual */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña actual
          </label>
          <div className="relative">
            <input
              type={showPasswords.actual ? 'text' : 'password'}
              value={passwordAnterior}
              onChange={(e) => setPasswordAnterior(e.target.value)}
              placeholder="Ingrese su contraseña actual"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('actual')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPasswords.actual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nueva contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showPasswords.nueva ? 'text' : 'password'}
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="Ingrese la nueva contraseña"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('nueva')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPasswords.nueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirmación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirmacion ? 'text' : 'password'}
              value={confirmacionPassword}
              onChange={(e) => setConfirmacionPassword(e.target.value)}
              placeholder="Confirme la nueva contraseña"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirmacion')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPasswords.confirmacion ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Cambiar
          </button>
        </div>
      </form>
    </Modal>
  );
}
