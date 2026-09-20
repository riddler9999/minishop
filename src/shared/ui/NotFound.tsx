import {ShopLink} from '@/features/tenancy/ShopLink';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-brand-200">404</p>
      <h1 className="my mt-2 font-display text-2xl font-bold text-brand-800">စာမျက်နှာ မတွေ့ပါ</h1>
      <ShopLink to="/" className="mt-6 inline-block rounded-full bg-brand-700 px-6 py-3 font-semibold text-cream-100 hover:bg-brand-800">
        ပင်မသို့ ပြန်သွားရန်
      </ShopLink>
    </div>
  );
}
