# QRDine — Campus Self-Order System

An end-to-end real-time self-ordering platform for college canteens built with **Node.js, Express, Socket.IO, and Vanilla JavaScript**. It features server-generated QR codes, simulated payment session verification using **SHA256 HMAC tokens**, and instant dual-screen synchronization between the Student Mobile App and the Vendor Kitchen Display System (KDS).

---

## Repository Structure

```
qrdine/
│
├── server/                        # Vendor App & Backend Logic
│   ├── package.json
│   ├── .env.example               # Environment template (copy to .env)
│   ├── server.js                  # Express + Socket.IO entry point
│   ├── config/
│   │   └── menuData.js            # Master menu source of truth
│   ├── routes/
│   │   ├── menuRoutes.js          # GET /api/menu
│   │   └── orderRoutes.js         # POST /api/order/create & /api/order/pay
│   ├── controllers/
│   │   ├── menuController.js      # Menu retrieval
│   │   └── orderController.js     # Order creation & SHA256 code generation
│   ├── sockets/
│   │   └── socketHandler.js       # Room joins & real-time broadcasts
│   ├── utils/
│   │   └── hashGenerator.js       # SHA256 HMAC token calculation
│   ├── store/
│   │   └── orderStore.js          # In-memory order persistence
│   ├── views/
│   │   ├── vendor-dashboard.html  # Kitchen Display System (KDS)
│   │   ├── vendor-dashboard.js    # Vendor dashboard controller
│   │   └── vendor-dashboard.css   # Vendor dashboard styles
│   └── tests/                     # Jest + supertest test suite
│
└── client/                        # Student Web App
    ├── package.json
    ├── public/
    │   ├── index.html             # Main Student App container
    │   └── src/
    │       ├── main.js            # App driver
    │       ├── api.js             # HTTP calls (Fetch API)
    │       ├── socket.js          # Socket.IO connection & events
    │       ├── components/
    │       │   ├── MenuList.js    # Menu UI component
    │       │   ├── Cart.js        # Cart & subtotal component
    │       │   ├── PaymentModal.js # QR display & payment simulation
    │       │   └── ReceiptCard.js # Final verification token display
    │       └── styles/
    │           └── app.css        # Responsive styles
```

---

## Features

- **Student App**: Browse menu, add to cart, generate payment QR, simulate payment, receive verification token
- **Vendor KDS**: Real-time order alerts with verification codes, connection status, empty state
- **Real-time sync**: Socket.IO rooms for private student order updates and vendor broadcast
- **Security**: Server-side price recalculation, HMAC-SHA256 verification tokens, replay attack prevention
- **Recovery**: Automatic socket reconnection with order status recovery

---

## Technology Stack

- **Runtime**: Node.js 18+
- **Backend**: Express.js, Socket.IO 4.7
- **Frontend**: Vanilla ES Modules, Socket.IO Client (CDN)
- **QR Codes**: `qrcode` library (Data URL generation)
- **Crypto**: Node.js built-in `crypto` module (HMAC-SHA256)
- **Testing**: Jest, supertest, socket.io-client

---

## Prerequisites

- Node.js 18+ and npm
- Git (for cloning)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/NeoWave2307/QRDine.git
cd QRDine

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## Environment Configuration

Copy the example environment file and edit as needed:

```bash
cd server
cp .env.example .env
```

**server/.env** (required variables):

```env
PORT=3000
HASH_SECRET=your-random-secret-here
CLIENT_URL=http://localhost:8080
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

---

## Running the Application

### Developer 1 — Backend & Vendor Dashboard

```bash
cd server
npm start
```

- Server runs on: `http://localhost:3000`
- Vendor KDS: `http://localhost:3000/vendor-dashboard.html`
- API base: `http://localhost:3000/api`

### Developer 2 — Student Client

```bash
cd client
npm start
```

- Student App: `http://localhost:8080`

> **Note**: The client's `package.json` uses `npx serve public -p 8080` to serve the static files.

---

## Mobile / Local Network Testing

When testing the student app on a phone connecting to the server running on a laptop:

1. Replace `localhost` in `client/public/src/api.js` and `client/public/src/socket.js` with the server machine's **local LAN IP** (e.g., `http://192.168.1.15:3000`).
2. Both devices **must be on the same Wi-Fi network or mobile hotspot**.
3. The server automatically binds to all interfaces (`0.0.0.0`), so no additional config is needed.

---

## API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/menu` | Fetch active menu | None | `{ success: true, menu: [...] }` |
| `POST` | `/api/order/create` | Validate order & issue QR | `{ items: [{ id, qty }] }` | `{ success: true, orderId, totalAmount, qrDataUrl }` |
| `POST` | `/api/order/pay` | Simulate payment & emit token | `{ orderId }` | `{ success: true, verificationHash }` |
| `GET` | `/api/order/:orderId` | Recover order status (reconnect) | None | `{ success: true, orderId, status, ... }` |

### Menu Item Schema
```json
{
  "id": "m1",
  "name": "Cold Coffee",
  "description": "Chilled coffee with milk and ice",
  "price": 50,
  "category": "Beverages",
  "image": "cold-coffee",
  "available": true
}
```

### Order Create Request
```json
{ "items": [{ "id": "m1", "qty": 2 }] }
```

### Order Create Response
```json
{
  "success": true,
  "orderId": "ORD_A1B2C3D4",
  "totalAmount": 100,
  "qrDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### Payment Response
```json
{ "success": true, "verificationHash": "CANTEEN-8F3A2B91" }
```

---

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_order_room` | `orderId` (string) | Student joins their private order room |
| `join_vendor_room` | (none) | Vendor joins the kitchen display room |

### Server → Student (room: `order_<ORDER_ID>`)
| Event | Payload |
|-------|---------|
| `order_status` | `{ orderId, status, totalAmount, verificationHash, paidAt, items }` — emitted on join for reconnect recovery |
| `payment_verified` | `{ orderId, verificationHash, items, totalAmount }` — emitted after successful payment |

### Server → Vendor (room: `vendor_main`)
| Event | Payload |
|-------|---------|
| `new_order_alert` | `{ orderId, verificationHash, items, totalAmount, paidAt }` — emitted for every newly paid order |

---

## Security & Edge Case Rules

1. **Anti-Price Tampering**: Server recalculates totals from `config/menuData.js` — client totals are ignored.
2. **Replay Payment Shield**: `POST /api/order/pay` on an already-paid order returns `400` with `{ error: "Order already processed" }`.
3. **Concurrent Payment Safety**: Atomic compare-and-set on order status prevents double-payment race conditions.
4. **Private Room Ownership**: First socket to join an order room claims ownership; other sockets are rejected with `order_error: { error: "Access denied" }`.
5. **Reconnect Recovery**: On socket reconnect, client re-emits `join_order_room` and receives `order_status` with current state (including verification hash if already paid).
6. **Secret Isolation**: `HASH_SECRET` is never exposed to clients; verification tokens are generated server-side only.
7. **In-Memory Storage**: Orders are stored in memory — data is lost on server restart. Acceptable for PBL demo.

---

## Testing

```bash
cd server
npm test
```

### Test Coverage (27 tests)
- ✅ GET /api/menu returns authoritative menu with correct schema
- ✅ POST /api/order/create validates items, recalculates total, generates QR Data URL
- ✅ Invalid items (unknown ID, unavailable, bad quantity) rejected with 400
- ✅ POST /api/order/pay marks order PAID, generates HMAC-SHA256 token
- ✅ Duplicate payment rejected (400/409)
- ✅ Unknown order ID rejected (404)
- ✅ Verification token uses configured `HASH_SECRET`
- ✅ Socket: vendor receives `new_order_alert` with same token as student
- ✅ Socket: student receives `order_status` on join for recovery
- ✅ Socket: unknown order room join rejected
- ✅ Socket: cross-student room access denied
- ✅ Vendor dashboard served at `/vendor-dashboard.html`

---

## Project Limitations (PBL Demo Scope)

- **In-memory order store**: Data lost on restart; not suitable for production.
- **Simulated payments**: No real payment gateway; `POST /api/order/pay` is a test trigger.
- **No authentication**: Ownership based on socket connection only.
- **Single vendor screen**: One `vendor_main` room for all kitchen displays.
- **No database**: Menu and orders are ephemeral.

---

## Architecture Diagram

```
[Student App]                      [Server / Socket.IO]                  [Vendor Dashboard]
     │                                      │                                    │
     ├── 1. GET /api/menu ─────────────────>│                                    │
     │<── 2. Returns menu JSON ─────────────┤                                    │
     │                                      │                                    │
     ├── 3. POST /api/order/create ────────>│ (Recalculates price on server)      │
     │<── 4. Returns {orderId, qrCode} ─────┤                                    │
     │                                      │                                    │
     ├── 5. Socket Join: 'order_123' ──────>│                                    │
     │                                      │<── 6. Socket Join: 'vendor_main' ───┤
     │                                      │                                    │
     ├── 7. POST /api/order/pay ───────────>│ (Generates SHA256 Hash Token)      │
     │                                      │                                    │
     │<── 8. Emit 'payment_verified' ───────┤ ── 9. Emit 'new_order_alert' ──────>│
     ▼                                                                           ▼
[Show Hash Token on Phone]                                                [Show Order Card on KDS]
```

---

## License

MIT — Educational project for Software Engineering PBL.