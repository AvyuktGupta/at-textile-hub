const STEPS = [
  {
    title: "Build your order",
    body: "Pick products and set quantities. Each item shows its minimum order and the price per unit after any discount.",
  },
  {
    title: "Submit — no payment online",
    body: "Send the order with your business and delivery details. Nothing is charged on the website.",
  },
  {
    title: "We confirm and dispatch",
    body: "You get an email copy straight away. Our team then contacts you to confirm stock, invoicing and dispatch.",
  },
];

export function HowOrderingWorks() {
  return (
    <section aria-labelledby="how-ordering-works" className="container-page py-10 sm:py-14">
      <div className="grid gap-8 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-10 lg:grid-cols-[1fr_2fr] lg:gap-14">
        <div>
          <h2 id="how-ordering-works" className="text-[26px] leading-tight sm:text-3xl">
            Ordering wholesale, without the back-and-forth
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Trade accounts only. Register once with your business details and every order reaches our sales desk
            complete.
          </p>
        </div>
        <ol className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-line pt-4">
              <span className="font-display text-sm font-semibold text-clay tabular-nums">0{index + 1}</span>
              <h3 className="mt-2 font-sans text-base font-semibold tracking-normal">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
