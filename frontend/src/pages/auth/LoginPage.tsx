import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Car, WifiOff, RefreshCw } from 'lucide-react';
import apiClient from '@/api/client';
import type { AxiosError } from 'axios';

interface ApiError {
  message?: string;
  error?: string;
}

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Verificar conexion con el backend al montar el componente
  const checkBackendConnection = useCallback(async () => {
    setCheckingConnection(true);
    try {
      // Hacer una peticion ligera al backend.
      // Si el servidor responde (cualquier status), esta online.
      // Solo si no hay respuesta (error de red), esta caido.
      // X-Skip-Toast evita que el interceptor muestre toasts por token invalido
      await apiClient.get('/auth/me', {
        timeout: 5000,
        headers: { 'X-Skip-Toast': 'true' },
      });
      // 200 = servidor online y token valido
      setBackendOnline(true);
    } catch (err) {
      const axiosErr = err as AxiosError;
      // Si hay response (cualquier status: 400, 401, 403, 404, 500...),
      // el servidor esta online — respondio algo
      if (axiosErr.response) {
        setBackendOnline(true);
      } else {
        // Sin response = error de red (ERR_NETWORK, ERR_CONNECTION_REFUSED,
        // ECONNABORTED) → servidor caido o inalcanzable
        setBackendOnline(false);
      }
    } finally {
      setCheckingConnection(false);
    }
  }, []);

  useEffect(() => {
    checkBackendConnection();
  }, [checkBackendConnection]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      // Si el error es de red (sin response), el backend se cayo durante el login
      if (!axiosErr.response) {
        setBackendOnline(false);
        setError(t('login.backendUnreachableMessage'));
      } else {
        const message =
          axiosErr.response?.data?.message ||
          axiosErr.response?.data?.error ||
          t('login.invalidCredentials');
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mientras verifica la conexion, mostrar spinner
  if (checkingConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
          <p className="text-primary-200 text-sm">{t('login.retryingConnection')}</p>
        </div>
      </div>
    );
  }

  // Si el backend esta caido, mostrar pantalla de error con boton de reintentar
  if (backendOnline === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-2xl mb-4">
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white">
              {t('login.backendUnreachableTitle')}
            </h1>
            <p className="text-primary-200 mt-2 text-sm px-4">
              {t('login.backendUnreachableMessage')}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <button
              onClick={checkBackendConnection}
              disabled={checkingConnection}
              className="btn-primary w-full py-2.5 text-base flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${checkingConnection ? 'animate-spin' : ''}`} />
              {t('login.retry')}
            </button>
          </div>

          <p className="text-center text-primary-300 text-xs mt-6">
            {t('login.systemTitle')}
          </p>
        </div>
      </div>
    );
  }

  // Backend online: mostrar formulario de login normal
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {t('login.title')}
          </h1>
          <p className="text-primary-200 mt-1 text-sm">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder={t('login.emailPlaceholder')}
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('login.password')}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder={t('login.passwordPlaceholder')}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-base"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t('login.submitting')}
                </span>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          {t('login.systemTitle')}
        </p>
      </div>
    </div>
  );
}
