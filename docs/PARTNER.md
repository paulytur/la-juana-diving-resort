# Partner website integration

Let other websites send guests to book at La Juana. Three options:

## 1. Payment link (simplest)

Send visitors **directly to the payment page** with QR code and 50% downpayment. Include the room slug and dates:

```
https://la-juana-resort.vercel.app/book/checkout?partner=PARTNER_ID&room=hiraya&checkIn=2026-08-01&checkOut=2026-08-03&guests=4
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `partner` | No | Partner ID for tracking |
| `room` | Yes | Room slug, e.g. `hiraya`, `mix-dormitory` |
| `checkIn` | Yes | `YYYY-MM-DD` |
| `checkOut` | Yes | `YYYY-MM-DD` |
| `guests` | Yes | Number of guests |
| `guestName` | No | Pre-fill guest name |
| `guestEmail` | No | Pre-fill guest email |
| `guestPhone` | No | Pre-fill guest phone |

The guest sees the La Juana room, pays **50% of the total stay** via QR, uploads their receipt, and the booking is confirmed. No separate booking request step.

**Example — dive shop website:**

```html
<a
  href="https://la-juana-resort.vercel.app/book/checkout?partner=mabini-dive-shop&room=hiraya&checkIn=2026-08-01&checkOut=2026-08-03&guests=4"
  target="_blank"
  rel="noopener"
>
  Pay downpayment at La Juana
</a>
```

For the full 3-step booking wizard (dates → room → payment), use `/book` instead of `/book/checkout`.

---

## 2. Pay button (opens La Juana in a new tab)

Partners do **not** embed an iframe on their site. Guests are sent to La Juana to pay.

Add a button that opens the checkout page in a new tab:

```html
<script
  src="https://la-juana-resort.vercel.app/embed.js"
  data-partner="mabini-dive-shop"
  data-room="hiraya"
  data-check-in="2026-08-01"
  data-check-out="2026-08-03"
  data-guests="4"
  data-label="Pay at La Juana Resort"
></script>
```

Or link directly:

```html
<a
  href="https://la-juana-resort.vercel.app/partner/pay/LJ-20260801-ABC12"
  target="_blank"
  rel="noopener"
>
  Complete payment at La Juana
</a>
```

### Immerseafy admin only — iframe payment

Only the **Immerseafy** partner (`PARTNER_EMBED_SLUG`) may embed the payment form in an iframe for internal admin use:

```
https://la-juana-resort.vercel.app/embed/partner/pay/LJ-20260801-ABC12
```

The partner API returns `urls.embedPayment` only for Immerseafy bookings. All other partners must redirect guests to `paymentUrl` (full page on La Juana).

---

## 3. Partner API (availability + bookings)

For sites that want to show rooms and prices on their own UI, or create bookings directly.

**Requires an API key.** Create one in **Admin → Partners**, then share it with the partner. Pass it as an `x-api-key` header (preferred), `Authorization: Bearer` token, or `apiKey` query parameter.

### Check availability

```
GET /api/partner/availability?checkIn=2026-08-01&checkOut=2026-08-03&guests=4
x-api-key: lj_live_...
```

The partner is identified by their key — no `partner` query parameter needed. Requests without a valid key get `401`.

**Response:**

```json
{
  "nights": 2,
  "partner": "mabini-dive-shop",
  "checkoutUrl": "https://la-juana-resort.vercel.app/book/checkout?...",
  "bookUrl": "https://la-juana-resort.vercel.app/book/checkout?...",
  "rooms": [
    {
      "slug": "hiraya",
      "name": "Hiraya",
      "subtotal": 12000,
      "totalAmount": 12000,
      "deposit": 6000,
      "checkoutUrl": "https://la-juana-resort.vercel.app/book/checkout?...&room=hiraya"
    }
  ]
}
```

Each room's `deposit` is **50% of the La Juana room total** for those dates.

### Create booking → redirect guest to pay on La Juana

```
POST /api/partner/bookings
x-api-key: lj_live_...
Content-Type: application/json
```

Your site collects the guest and room details. La Juana creates the booking and returns a **payment URL**. Redirect the guest there to scan the QR and upload their receipt — payment always happens on La Juana.

**Request body:**

| Field | Required | Description |
|-------|----------|-------------|
| `roomSlug` or `roomTypeId` | Yes (one of) | La Juana room to book |
| `checkIn` | Yes | `YYYY-MM-DD` |
| `checkOut` | Yes | `YYYY-MM-DD` |
| `guests` | Yes | 1–20 |
| `guestName` | Yes | Guest full name |
| `guestEmail` | Yes | Guest email |
| `guestPhone` | Yes | Contact number |
| `specialRequests` | No | Free text |
| `pets` | No | Default `0` |
| `dayTourGuests` | No | Default `0` |

**Example — partner site redirects after booking:**

```javascript
const response = await fetch(
  "https://la-juana-resort.vercel.app/api/partner/bookings",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "lj_live_YOUR_KEY",
    },
    body: JSON.stringify({
      roomSlug: "hiraya",
      checkIn: "2026-08-01",
      checkOut: "2026-08-03",
      guests: 4,
      guestName: "Jane Cruz",
      guestEmail: "jane@example.com",
      guestPhone: "+639171234567",
    }),
  },
);
const data = await response.json();
// Redirect guest to La Juana partner payment page (bank transfer + receipt upload)
window.location.href = data.paymentUrl;
```

**Response (201):**

```json
{
  "reference": "LJ-20260801-ABC12",
  "paymentUrl": "https://la-juana-resort.vercel.app/partner/pay/LJ-20260801-ABC12",
  "redirectUrl": "https://la-juana-resort.vercel.app/partner/pay/LJ-20260801-ABC12",
  "pricing": {
    "totalAmount": 12000,
    "depositAmount": 6000
  },
  "message": "Booking created. Redirect the guest to paymentUrl to upload their bank transfer receipt on La Juana."
}
```

For Immerseafy admin iframe only, use `urls.embedPayment` (`/embed/partner/pay/{reference}`). Other partners redirect guests to `paymentUrl`.

### Partner payment page

After redirect, the guest sees a dedicated page at `/partner/pay/{reference}`:

1. **Bank transfer details** — account name, account number, exact amount (50% downpayment)
2. **Optional QR** — for InstaPay / e-wallet if configured in admin
3. **Upload receipt** — guest enters transfer reference and uploads screenshot from their bank app

Direct link (after booking is created):

```
https://la-juana-resort.vercel.app/partner/pay/LJ-20260801-ABC12
```

### Checkout link (guest details not collected yet)

If your site has not collected guest contact info, omit `guestName` / `guestEmail` / `guestPhone`. The API returns a `checkoutUrl` where the guest enters details and pays on La Juana.

**Response (200):**

```json
{
  "checkoutUrl": "https://la-juana-resort.vercel.app/book/checkout?partner=mabini-dive-shop&room=hiraya&checkIn=2026-08-01&checkOut=2026-08-03&guests=4",
  "message": "Guest contact is required to create a booking..."
}
```

### Confirm a booking with payment (server-side)

If your server already has the guest's payment proof, include `paymentReference`, `paymentProofUrl`, and guest contact fields to create the booking immediately.

```json
{
  "reference": "LJ-20260801-ABC12",
  "status": "PENDING",
  "partner": "mabini-dive-shop",
  "guest": { "name": "Jane Cruz", "email": "jane@example.com", "phone": "+639171234567" },
  "room": { "slug": "hiraya", "name": "Hiraya" },
  "stay": {
    "checkIn": "2026-08-01",
    "checkOut": "2026-08-03",
    "guests": 4,
    "nights": 2
  },
  "pricing": {
    "totalAmount": 12000,
    "depositAmount": 6000,
    "balanceDue": 6000
  },
  "payment": { "completed": false },
  "urls": {
    "payment": "https://la-juana-resort.vercel.app/partner/pay/LJ-20260801-ABC12",
    "confirmation": "https://la-juana-resort.vercel.app/book/confirmation/LJ-20260801-ABC12",
    "invoice": null
  }
}
```

### Look up a booking

Partners can only retrieve bookings they created.

```
GET /api/partner/bookings?reference=LJ-20260801-ABC12
x-api-key: lj_live_...
```

CORS is enabled so partner sites can call these endpoints from the browser.

### Example fetch (availability)

```javascript
const params = new URLSearchParams({
  checkIn: "2026-08-01",
  checkOut: "2026-08-03",
  guests: "4",
});

const response = await fetch(
  `https://la-juana-resort.vercel.app/api/partner/availability?${params}`,
  { headers: { "x-api-key": "lj_live_YOUR_KEY" } },
);
const data = await response.json();
// Use data.rooms and link each room to data.rooms[i].bookUrl
```

> Note: calling the API from a browser exposes the key to visitors. For public
> websites, partners should proxy the request through their own server, or just
> use the booking links / embed widget (no key needed).

---

## Managing partners

Create and manage partners in **Admin → Partners**:

- **Create partner** — generates their slug and API key
- **Show / Copy** the key to share it securely
- **Disable** — key and tracking stop working immediately
- **Regenerate key** — invalidates the old key
- **Remove** — deletes the partner entirely

## Tracking

Bookings include `partnerSource` when the guest arrives via a partner link. Only slugs of **registered, active partners** are stored — unknown partner IDs are ignored. View partner names in **Admin → Bookings**.

---

## Environment variables

Add to Vercel / `.env`:

```bash
NEXT_PUBLIC_SITE_URL="https://la-juana-resort.vercel.app"
# Optional: restrict API CORS (comma-separated origins, or * for all)
PARTNER_ALLOWED_ORIGINS="*"
```

---

## Booking flow for partners

1. Guest books on the partner site (room, dates, contact)
2. Partner calls `POST /api/partner/bookings` with guest details
3. Partner **redirects the guest to `paymentUrl`** (`/partner/pay/{reference}`)
4. Guest **bank-transfers** the 50% downpayment, then **uploads transfer receipt** on La Juana
5. Booking is tagged with the partner ID — admin confirms and sends invoice

Payment and confirmation stay on La Juana — partners do not handle money or admin access.
