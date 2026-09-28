import {useEffect, useMemo, useState} from 'react';
import {adminApi} from '@/data/dataSource';
import type {Product} from '@/domain/product';
import type {StoreDesignLifecycle} from '@/domain/storeDesign';
import {usePlan} from '@/features/billing/plan';
import {StoreBuilderShell} from '@/features/shop/storeBuilder/StoreBuilderShell';

export default function LifecycleStoreBuilder() {
  const {shop} = usePlan();
  const [lifecycle, setLifecycle] = useState<StoreDesignLifecycle | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([adminApi.loadOwnStoreDesign(), adminApi.listProducts()])
      .then(([nextLifecycle, productResult]) => {
        if (!alive) return;
        setLifecycle(nextLifecycle);
        setProducts(productResult.products.filter((product) => product.status === 'active'));
      })
      .catch((reason) => { if (alive) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { alive = false; };
  }, []);

  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))), [products]);

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!lifecycle) return <div className="grid min-h-[40vh] place-items-center text-sm text-ink-soft">Loading Store Builder…</div>;

  return (
    <StoreBuilderShell
      initialDocument={lifecycle.draft}
      initialRevision={lifecycle.draftRevision}
      products={products}
      categories={categories}
      shopName={shop?.name ?? 'သင့်ဆိုင်'}
      saveDraft={adminApi.saveDraft}
      publishDraft={adminApi.publishDraft}
    />
  );
}
