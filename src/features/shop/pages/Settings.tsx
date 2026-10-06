// ---- Settings Hub V3 (Shopify-inspired architecture) ------------------------
// Organizes supported configuration into 11 clear groups with in-place General
// profile management and direct navigation to supported settings detail views.

import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Store,
  Save,
  Link2,
  Copy,
  Check,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  CreditCard,
  Globe,
  ShieldCheck,
  Truck,
  Users,
  Banknote,
  ShoppingCart,
  Bell,
  Lock,
  Palette,
  ArrowRight,
  Bot,
} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {User} from '@supabase/supabase-js';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {usePlan, PLAN_LABEL} from '@/features/billing/plan';
import {updateOwnShop, type OwnShop} from '@/features/shop/sellerShop';
import {SHOP_LOGOS_BUCKET} from '@/core/storage/buckets';
import {adminApi} from '@/data/dataSource';
import {
  validateImageFile,
  prepareImageForUpload,
  deriveStoragePath,
} from '@/core/storage/imageUpload';
import {PlanBadge} from '@/features/billing/PlanGate';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminSurface from '@/features/admin/components/AdminSurface';
import AdminLoadingState from '@/features/admin/components/AdminLoadingState';
import {cx} from '@/shared/lib/format';

const field =
  'w-full rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] px-3.5 py-2.5 text-sm text-[#1F2421] outline-none focus:border-[#35B99D] focus:ring-1 focus:ring-[#35B99D]';
const lbl = 'mb-1.5 block text-sm font-semibold text-[#1F2421]';

export default function Settings() {
  const {user} = useAdminAuth();
  const {shop, loading} = usePlan();

  if (loading) {
    return <AdminLoadingState message="Loading store settings..." />;
  }
  if (!shop || !user) {
    return (
      <div className="p-8 text-center text-sm text-[#66706C]">
        Store information could not be found.
      </div>
    );
  }

  return <SettingsForm key={shop.id} shop={shop} user={user} />;
}

function SettingsForm({shop, user}: {shop: OwnShop; user: User}) {
  const {plan, features, refresh} = usePlan();

  const [name, setName] = useState(shop.name);
  const [phone, setPhone] = useState(shop.phone ?? '');
  const [fee, setFee] = useState(String(shop.defaultDeliveryFee));
  const [logoUrl, setLogoUrl] = useState(shop.logoUrl ?? '');
  const [pendingLogoPath, setPendingLogoPath] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoErr, setLogoErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [copied, setCopied] = useState(false);

  const pendingLogoPathRef = useRef(pendingLogoPath);
  pendingLogoPathRef.current = pendingLogoPath;
  useEffect(
    () => () => {
      if (pendingLogoPathRef.current) void adminApi.deleteShopLogo(pendingLogoPathRef.current);
    },
    [],
  );

  const storeUrl = useMemo(() => `${window.location.origin}/s/${shop.slug}`, [shop.slug]);

  const save = async () => {
    const feeN = Number(fee);
    if (!name.trim()) return setErr('Please enter store name.');
    if (!Number.isFinite(feeN) || feeN < 0) return setErr('Invalid delivery fee.');
    setErr('');
    setOk(false);
    setSaving(true);
    const previousLogoUrl = shop.logoUrl;
    try {
      await updateOwnShop(user.id, {
        name,
        phone,
        defaultDeliveryFee: feeN,
        logoUrl,
      });
      if (previousLogoUrl && previousLogoUrl !== logoUrl) {
        const oldPath = deriveStoragePath(previousLogoUrl, SHOP_LOGOS_BUCKET);
        if (oldPath) await adminApi.deleteShopLogo(oldPath).catch(() => {});
      }
      setPendingLogoPath(null);
      setOk(true);
      refresh();
    } catch (e: unknown) {
      if (pendingLogoPath) {
        await adminApi.deleteShopLogo(pendingLogoPath).catch(() => {});
        setPendingLogoPath(null);
        setLogoUrl(shop.logoUrl ?? '');
      }
      setErr(e instanceof Error ? e.message : 'Cannot save settings.');
    } finally {
      setSaving(false);
    }
  };

  const onLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) return setLogoErr(validationError);
    setLogoErr('');
    setUploadingLogo(true);
    try {
      const prepared = await prepareImageForUpload(file);
      const {url, path} = await adminApi.uploadShopLogo(prepared);
      if (pendingLogoPath) await adminApi.deleteShopLogo(pendingLogoPath).catch(() => {});
      setPendingLogoPath(path);
      setLogoUrl(url);
    } catch (e: unknown) {
      setLogoErr(e instanceof Error ? e.message : 'Cannot upload image.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (pendingLogoPath) {
      await adminApi.deleteShopLogo(pendingLogoPath).catch(() => {});
      setPendingLogoPath(null);
    }
    setLogoUrl('');
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard fallback */
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <AdminPageHeader
          title="Settings"
          description="Manage store operations, plan subscription, shipping, policies, and store details."
        />
        <div className="flex items-center gap-2">
          <PlanBadge />
        </div>
      </div>

      {/* 11 Configuration Categories Hub */}
      <section aria-label="Settings configuration categories" className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#66706C]">
          Configuration Hub
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. General Store Details */}
          <a
            href="#general-profile"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8F1EA] text-[#29957F]">
                  <Store className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#D8F1EA] px-2 py-0.5 text-[10px] font-bold text-[#29957F]">
                  Active
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                General / Store Details
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Store name, contact phone, and public link
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>Edit profile</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </a>

          {/* 2. Plan and Billing */}
          <Link
            to="/admin/settings/billing"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8F1EA] text-[#29957F]">
                  <CreditCard className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#D8F1EA] px-2 py-0.5 text-[10px] font-bold text-[#29957F]">
                  {PLAN_LABEL[plan]}
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                Plan &amp; Billing
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Subscription status, monthly order quota &amp; Extra Orders
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>Manage plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* 3. Users and Permissions */}
          <Link
            to="/admin/settings/users"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F7F5] text-[#1F2421]">
                  <Users className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#F4F7F5] px-2 py-0.5 text-[10px] font-bold text-[#66706C]">
                  Owner
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                Users &amp; Permissions
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Account ownership, credentials &amp; access control
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>View permissions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* 4. Payments */}
          <Link
            to="/admin/settings/payments"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8F1EA] text-[#29957F]">
                  <Banknote className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#D8F1EA] px-2 py-0.5 text-[10px] font-bold text-[#29957F]">
                  Enabled
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                Payments &amp; Transfers
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Cash on Delivery (COD), KBZPay &amp; WavePay transfer settings
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>Payment methods</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* 5. Checkout */}
          <Link
            to="/admin/settings/checkout"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8F1EA] text-[#29957F]">
                  <ShoppingCart className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#D8F1EA] px-2 py-0.5 text-[10px] font-bold text-[#29957F]">
                  Standard
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                Checkout Rules
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Customer phone collection &amp; mandatory Buy Now flow
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>Checkout rules</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* 6. Shipping and Delivery */}
          <Link
            to="/admin/settings/shipping"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8F1EA] text-[#29957F]">
                  <Truck className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#D8F1EA] px-2 py-0.5 text-[10px] font-bold text-[#29957F]">
                  Custom Zones
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                Shipping &amp; Delivery
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Township delivery zones, rates &amp; default fees
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>Manage zones</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* 7. Domains */}
          <Link
            to="/admin/settings/domains"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F7F5] text-[#1F2421]">
                  <Globe className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#F4F7F5] px-2 py-0.5 text-[10px] font-bold text-[#66706C]">
                  Read-only
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                Domains
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Storefront bio URL &amp; custom domain status
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>View domains</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* 8. Policies */}
          <Link
            to="/admin/settings/policies"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F7F5] text-[#1F2421]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#F4F7F5] px-2 py-0.5 text-[10px] font-bold text-[#66706C]">
                  Default
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                Policies
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Return, refund, shipping, and terms policies
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>View policies</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* 9. Notifications */}
          <Link
            to="/admin/settings/notifications"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F7F5] text-[#1F2421]">
                  <Bell className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#F4F7F5] px-2 py-0.5 text-[10px] font-bold text-[#66706C]">
                  Automatic
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                Notifications
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Transactional order and shipping alerts
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>View notifications</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* 10. Customer Privacy */}
          <Link
            to="/admin/settings/privacy"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8F1EA] text-[#29957F]">
                  <Lock className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#D8F1EA] px-2 py-0.5 text-[10px] font-bold text-[#29957F]">
                  Protected
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                Customer Privacy
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Multi-tenant data isolation &amp; buyer privacy
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>Privacy standards</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* 11. AI Settings & BYOK */}
          <Link
            to="/admin/settings/ai"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8F1EA] text-[#29957F]">
                  <Bot className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#D8F1EA] px-2 py-0.5 text-[10px] font-bold text-[#29957F]">
                  BYOK
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                AI Settings
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Configure AI provider keys &amp; models for Store Builder
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>Manage AI keys</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* 11. Brand and Media */}
          <Link
            to="/admin/online-store/themes"
            className="group flex flex-col justify-between rounded-xl border border-[#E1E7E3] bg-[#FFFFFF] p-4 transition hover:border-[#35B99D] hover:shadow-xs"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D8F1EA] text-[#29957F]">
                  <Palette className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#D8F1EA] px-2 py-0.5 text-[10px] font-bold text-[#29957F]">
                  Customizable
                </span>
              </div>
              <p className="text-sm font-bold text-[#1F2421] group-hover:text-[#29957F]">
                Brand &amp; Media
              </p>
              <p className="mt-1 text-xs text-[#66706C]">
                Store logo, themes &amp; visual storefront design
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#29957F]">
              <span>Themes &amp; Brand</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Public link */}
      <AdminSurface>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#1F2421]">
          <Link2 className="h-4 w-4 text-[#35B99D]" /> Public Store Link
        </h2>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] px-3.5 py-2.5 text-sm text-[#1F2421]">
            {storeUrl}
          </code>
          <button
            type="button"
            onClick={copyUrl}
            className="inline-flex shrink-0 min-h-11 items-center gap-1.5 rounded-xl border border-[#E1E7E3] px-3.5 py-2 text-sm font-semibold text-[#1F2421] hover:bg-[#F4F7F5] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D]"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-xs text-[#66706C]">
          Share this link in your TikTok bio, posts, or messages. The store slug is read-only here.
        </p>
      </AdminSurface>

      {/* General Profile Form */}
      <AdminSurface id="general-profile">
        <h2 className="text-base font-bold text-[#1F2421]">General Store Profile</h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className={lbl}>
              Store name <span className="text-rose-600">*</span>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
              placeholder="Store name"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={lbl}>Phone number</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={field}
                placeholder="09xxxxxxxxx"
              />
            </label>
            <label className="block">
              <span className={lbl}>Default delivery fee (Ks)</span>
              <input
                inputMode="numeric"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className={field}
                placeholder="0"
              />
            </label>
          </div>

          {/* Logo Branding */}
          <div className="block">
            <span className={lbl}>
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-[#35B99D]" /> Store logo
              </span>
            </span>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative">
                  <img
                    src={logoUrl}
                    alt="logo preview"
                    className="h-14 w-14 rounded-xl border border-[#E1E7E3] object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    aria-label="Remove logo"
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#1F2421] text-white shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-dashed border-[#E1E7E3] bg-[#F4F7F5] text-[#66706C]">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              <label
                className={cx(
                  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E1E7E3] px-3.5 py-2.5 text-sm font-semibold text-[#1F2421] hover:bg-[#F4F7F5] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D]',
                  uploadingLogo && 'pointer-events-none opacity-60',
                )}
              >
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadingLogo ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
                <input
                  type="file"
                  accept="image/png,image/webp"
                  className="hidden"
                  onChange={onLogoFileChange}
                  disabled={uploadingLogo}
                />
              </label>
            </div>
            <span className="mt-1.5 block text-xs text-[#66706C]">
              PNG or WebP only (JPG/JPEG not supported) — appears on storefront and console.
            </span>
            {logoErr && <p className="mt-1 text-sm text-rose-600">{logoErr}</p>}
          </div>

          {err && <p className="text-sm text-rose-600">{err}</p>}
          {ok && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <Check className="h-4 w-4" /> Settings saved successfully.
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1F2421] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#303a35] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35B99D] disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </div>
      </AdminSurface>

      {/* Integration hooks */}
      {features.integrations && (
        <AdminSurface>
          <h2 className="mb-1 text-sm font-bold text-[#1F2421]">Integration-ready</h2>
          <p className="mb-3 text-xs text-[#66706C]">
            The following public endpoints can be connected to external tools or automations.
          </p>
          <dl className="space-y-2 text-sm">
            <IntegrationRow label="Storefront" value={storeUrl} />
            <IntegrationRow label="Order tracking" value={`${storeUrl}/orders`} />
          </dl>
        </AdminSurface>
      )}

      <p className="text-xs text-[#66706C]">
        Current Subscription Plan: <span className="font-semibold text-[#1F2421]">{PLAN_LABEL[plan]}</span>
      </p>
    </div>
  );
}

function IntegrationRow({label, value}: {label: string; value: string}) {
  return (
    <div
      className={cx(
        'flex flex-col gap-1 rounded-xl border border-[#E1E7E3] bg-[#F4F7F5] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      <span className="font-semibold text-xs text-[#66706C]">{label}</span>
      <code className="truncate text-xs text-[#1F2421]">{value}</code>
    </div>
  );
}
