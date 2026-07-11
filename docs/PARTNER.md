# Partner website integration

Let other websites send guests to book at La Juana. Three options:

## 1. Booking link (simplest)

Send visitors to your booking page with optional pre-filled dates:

```
https://la-juana-resort.vercel.app/book?partner=PARTNER_ID&checkIn=2026-08-01&checkOut=2026-08-03&guests=4
```

| Parameter | Description |
|-----------|-------------|
| `partner` | Your partner ID (letters, numbers, `-`, `_`, `.`) — tracked on the booking |
| `checkIn` | `YYYY-MM-DD` |
| `checkOut` | `YYYY-MM-DD` |
| `guests` | Number of guests |
| `room` | Room slug, e.g. `hiraya`, `mix-dormitory` |

**Example — dive shop website:**

```html
<a
  href="https://la-juana-resort.vercel.app/book?partner=mabini-dive-shop&guests=4"
  target="_blank"
  rel="noopener"
>
  Book accommodation at La Juana
</a>
```

---

## 2. Embed widget (iframe on their site)

Add this where the booking form should appear:

```html
<script
  src="https://la-juana-resort.vercel.app/embed.js"
  data-partner="mabini-dive-shop"
  data-check-in="2026-08-01"
  data-check-out="2026-08-03"
  data-guests="4"
  data-height="760"
></script>
```

### Button mode (opens booking in a new tab)

```html
<script
  src="https://la-juana-resort.vercel.app/embed.js"
  data-mode="button"
  data-partner="mabini-dive-shop"
  data-label="Book La Juana Resort"
></script>
```

### Script attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-base` | Production URL | Your La Juana site URL |
| `data-partner` | — | Partner ID for tracking |
| `data-mode` | `embed` | `embed` (iframe) or `button` |
| `data-height` | `760` | iframe height in pixels |
| `data-check-in` | — | Pre-fill check-in date |
| `data-check-out` | — | Pre-fill check-out date |
| `data-guests` | — | Pre-fill guest count |
| `data-room` | — | Pre-select room slug |
| `data-label` | `Book with La Juana` | Button text (button mode) |

Direct embed URL (without script):

```
https://la-juana-resort.vercel.app/embed/book?partner=PARTNER_ID
```

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
  "bookUrl": "https://la-juana-resort.vercel.app/book?...",
  "embedUrl": "https://la-juana-resort.vercel.app/embed/book?...",
  "rooms": [
    {
      "slug": "hiraya",
      "name": "Hiraya",
      "subtotal": 12000,
      "deposit": 6000,
      "bookUrl": "https://la-juana-resort.vercel.app/book?...&room=hiraya"
    }
  ]
}
```

### Create a booking

```
POST /api/partner/bookings
x-api-key: lj_live_...
Content-Type: application/json
```

**Request body:**

| Field | Required | Description |
|-------|----------|-------------|
| `roomSlug` or `roomTypeId` | Yes (one of) | Room to book |
| `checkIn` | Yes | `YYYY-MM-DD` |
| `checkOut` | Yes | `YYYY-MM-DD` |
| `guests` | Yes | 1–20 |
| `guestName` | Yes | Guest full name |
| `guestEmail` | Yes | Guest email |
| `guestPhone` | Yes | Contact number |
| `specialRequests` | No | Free text |
| `pets` | No | Default `0` |
| `dayTourGuests` | No | Default `0` |
| `paymentReference` | No | GCash/bank ref (with `paymentProofUrl`) |
| `paymentProofUrl` | No | Receipt image URL from upload |

If payment fields are omitted, the response includes `urls.payment` — send the guest there to pay the 50% deposit via QR.

**Example:**

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
const booking = await response.json();
// booking.reference — booking ID
// booking.urls.payment — send guest here if payment not included
// booking.urls.confirmation — after payment is submitted
```

**Response (201):**

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
    "payment": "https://la-juana-resort.vercel.app/book/pay/LJ-20260801-ABC12",
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

Bookings include `partnerSource` when the guest arrives via a partner link or embed. Only slugs of **registered, active partners** are stored — unknown partner IDs are ignored. View partner names in **Admin → Bookings**.

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

1. Guest finds La Juana on a partner site
2. They open the booking link, embed, or room link from the API
3. They complete the same 3-step flow (dates → room → 50% QR payment)
4. Booking is tagged with the partner ID
5. La Juana admin confirms and generates the invoice

Payment and confirmation stay on La Juana — partners do not handle money or admin access.
