const BOOKING_STEPS = [
  {
    step: "1",
    title: "Pick dates & guests",
    text: "Choose your check-in, check-out, and how many people are staying.",
  },
  {
    step: "2",
    title: "Choose an available room",
    text: "We only show rooms that fit your group and are free for those dates.",
  },
  {
    step: "3",
    title: "Pay 50% via QR",
    text: "Scan the QR code, pay the downpayment, then upload your receipt to confirm.",
  },
] as const;

type BookingHowToProps = {
  compact?: boolean;
  centered?: boolean;
};

export function BookingHowTo({
  compact = false,
  centered = false,
}: BookingHowToProps) {
  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {!compact && (
        <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
          <p className="section-eyebrow">How to book</p>
          <h2 className="section-title mt-2">Three easy steps</h2>
          <p className="section-lead mt-3">
            Secure your stay with a 50% downpayment. The balance is due when you
            arrive.
          </p>
        </div>
      )}

      {compact && (
        <p className="text-sm font-semibold text-brand-blue">How to book</p>
      )}

      <ol
        className={
          compact
            ? "grid list-none gap-3 pl-0 sm:grid-cols-3"
            : "mt-4 grid list-none gap-5 pl-0 sm:grid-cols-3"
        }
      >
        {BOOKING_STEPS.map((item) => (
          <li
            key={item.step}
            className={
              compact
                ? "rounded-xl border border-line bg-white px-4 py-4"
                : "step-card text-left"
            }
          >
            <span className={compact ? "step-number step-number--sm" : "step-number"}>
              {item.step}
            </span>
            <h3
              className={
                compact
                  ? "mt-3 text-sm font-bold text-brand-blue"
                  : "mt-4 font-bold text-brand-blue"
              }
            >
              {item.title}
            </h3>
            <p
              className={
                compact
                  ? "mt-1.5 text-xs leading-relaxed text-muted"
                  : "input-hint mt-2"
              }
            >
              {item.text}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
