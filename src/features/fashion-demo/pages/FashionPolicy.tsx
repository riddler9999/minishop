export default function FashionPolicy({title}: {title: string}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-14 pt-8 sm:px-6">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c92b59]">Store information</p>
      <h1 className="mt-1 font-display text-2xl font-black tracking-[-0.04em]">{title}</h1>
      <div className="my mt-5 rounded-[20px] bg-white p-5 text-sm leading-7 text-slate-500 shadow-[0_10px_28px_rgba(88,52,64,0.07)]">အကြောင်းအရာကို ဆိုင်ဘက်မှ ထည့်သွင်းနိုင်ရန် ပြင်ဆင်ထားပါသည်။</div>
    </div>
  );
}
