import {useState, useEffect} from 'react';
import {Bot, Key, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff, Trash2, Cpu} from 'lucide-react';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';
import {
  AI_PROVIDERS,
  type AiProviderId,
  type AiConnectionTestResult,
  type AiCredentialMetadata,
  getProviderCapabilities,
} from '@/domain/aiProvider';
import {adminApi} from '@/data/dataSource';

export default function AiSettings() {
  const [selectedProvider, setSelectedProvider] = useState<AiProviderId>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedKeyMasked, setSavedKeyMasked] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AiConnectionTestResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [credentials, setCredentials] = useState<AiCredentialMetadata[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoadingCredentials(true);
    adminApi.listAiCredentials()
      .then((result) => {
        if (!alive) return;
        setCredentials(result.credentials);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (alive) setError(loadError instanceof Error ? loadError.message : 'Could not load AI credentials.');
      })
      .finally(() => {
        if (alive) setLoadingCredentials(false);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const credential = credentials.find((item) => item.provider === selectedProvider && item.configured);
    setSavedKeyMasked(credential?.maskedKey ?? null);
    setTestResult(null);
    setApiKey('');
  }, [selectedProvider, credentials]);

  const providerDescriptor = AI_PROVIDERS[selectedProvider];
  const capabilities = getProviderCapabilities(selectedProvider);

  async function handleTestConnection() {
    if (!savedKeyMasked) {
      setTestResult({
        ok: false,
        provider: selectedProvider,
        model: providerDescriptor.defaultModel,
        message: 'Save an API key before testing the connection.',
        testedAt: new Date().toISOString(),
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await adminApi.testAiConnection(selectedProvider);

      setTestResult({
        ok: result.ok,
        provider: result.provider,
        model: result.model,
        message: `Connection successful! ${providerDescriptor.name} model [${providerDescriptor.defaultModel}] responded cleanly.`,
        testedAt: result.testedAt,
      });
    } catch (err: unknown) {
      setTestResult({
        ok: false,
        provider: selectedProvider,
        model: providerDescriptor.defaultModel,
        message: err instanceof Error ? err.message : 'Connection test failed. Please verify API key.',
        testedAt: new Date().toISOString(),
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveKey() {
    if (!apiKey.trim()) return;
    setSaving(true);
    setError('');
    try {
      const {credential} = await adminApi.saveAiCredential(selectedProvider, apiKey);
      setCredentials((current) => current.map((item) => item.provider === selectedProvider ? credential : item));
      setSavedKeyMasked(credential.maskedKey ?? null);
      setApiKey('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save API key.');
    } finally {
      setSaving(false);
    }
  }

  async function handleClearKey() {
    try {
      await adminApi.removeAiCredential(selectedProvider);
      setCredentials((current) => current.map((item) => item.provider === selectedProvider
        ? {provider: selectedProvider, configured: false}
        : item));
      setSavedKeyMasked(null);
      setApiKey('');
      setTestResult(null);
    } catch (removeError: unknown) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove API key.');
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="AI Settings & BYOK Credentials"
        description="Configure Bring-Your-Own-Key (BYOK) AI providers to power the MiniShop AI Store Builder."
      />

      {/* Security Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-primary-soft)] p-4 text-sm text-[var(--admin-text)]">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--admin-primary-hover)]" />
        <div>
          <p className="font-bold">Encrypted & Tenant-Isolated BYOK Storage</p>
          <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
            API keys are encrypted, tenant-scoped, and used strictly for executing typed Store Design commands. Your key is never re-exposed after saving.
          </p>
        </div>
      </div>

      <AdminSurface>
        {loadingCredentials && <p className="text-sm text-[var(--admin-muted)]">Loading credential status…</p>}
        {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
        <h2 className="text-base font-bold text-[var(--admin-text)] flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--admin-primary-hover)]" />
          AI Provider Selection
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(AI_PROVIDERS) as AiProviderId[]).map((provId) => {
            const prov = AI_PROVIDERS[provId];
            const isSelected = selectedProvider === provId;
            return (
              <button
                key={provId}
                type="button"
                onClick={() => setSelectedProvider(provId)}
                className={`flex flex-col justify-between rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-[var(--admin-primary)] bg-[var(--admin-primary-soft)] shadow-sm'
                    : 'border-[var(--admin-border)] bg-white hover:border-[var(--admin-primary)]'
                }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[var(--admin-text)]">{prov.name}</span>
                    <Cpu className="h-4 w-4 text-[var(--admin-muted)]" />
                  </div>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    Default: <code className="font-semibold">{prov.defaultModel}</code>
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Provider Configuration */}
        <div className="mt-6 space-y-4 border-t border-[var(--admin-border)] pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--admin-text)]">
              {providerDescriptor.name} Settings
            </h3>
            <div className="flex items-center gap-1.5">
              {capabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded-full bg-[var(--admin-canvas)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--admin-muted)] border border-[var(--admin-border)] uppercase tracking-wide">
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {savedKeyMasked && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-[var(--admin-muted)]">Active Key:</span>
                <code className="font-mono text-xs font-bold text-[var(--admin-text)]">{savedKeyMasked}</code>
              </div>
              <button
                type="button"
                onClick={handleClearKey}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline">
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[var(--admin-text)]">
              {savedKeyMasked ? 'Replace API Key' : 'Enter API Key'}
            </label>
            <div className="relative mt-1.5 flex items-center">
              <Key className="absolute left-3.5 h-4 w-4 text-[var(--admin-muted)]" />
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={savedKeyMasked ? '••••••••••••••••' : `Enter ${providerDescriptor.name} API Key`}
                className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-canvas)] pl-10 pr-24 py-2.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-primary)] focus:ring-1 focus:ring-[var(--admin-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 text-xs text-[var(--admin-muted)] hover:text-[var(--admin-text)]">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={!apiKey.trim() || saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--admin-text)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--admin-sidebar-hover)] transition disabled:opacity-40">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save API Key
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !savedKeyMasked}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--admin-text)] hover:bg-[var(--admin-canvas)] transition">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Test Connection
            </button>
          </div>

          {savedSuccess && (
            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> API Key saved successfully.
            </p>
          )}

          {testResult && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                testResult.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}>
              <div className="flex items-start gap-2">
                {testResult.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs">{testResult.ok ? 'Connection Passed' : 'Connection Failed'}</p>
                  <p className="mt-1 text-xs">{testResult.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminSurface>
    </div>
  );
}
