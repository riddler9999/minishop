const featureItems = [
  {icon: '◉', title: 'ပစ္စည်းတွေ မြင်အောင်ပြ', body: 'ပုံနဲ့ စျေးနှုန်းကို ရှင်းရှင်းလင်းလင်း ပြနိုင်မယ်။'},
  {icon: '🛒', title: 'အလွယ်တကူ Order တင်', body: 'Mobile ကနေ အဆင်ပြေပြေ ဝယ်ယူနိုင်မယ်။'},
  {icon: '↗', title: 'Social Media ကနေ ဝယ်သူရ', body: 'TikTok, Telegram, Facebook ကနေ ဆိုင် Link ကို မျှဝေပါ။'},
];

export default function HowItWorks() {
  return (
    <section className="landing-benefits" aria-label="MiniShop benefits">
      {featureItems.map((item) => (
        <article key={item.title}>
          <span className="landing-benefit-icon" aria-hidden="true">{item.icon}</span>
          <h2>{item.title}</h2>
          <p>{item.body}</p>
        </article>
      ))}
    </section>
  );
}
