# QRDine
Canteen Self Order Application
Great choice! **`qrdine`** (or **`qrdine-campus`**) is punchy, memorable, and fits the product perfectly.

Here is your complete, copy-paste-ready **`README.md`** file tailored specifically for the **`qrdine`** repository. Save this directly into the root folder of your project so both you and your teammate can stay on the same page.

---

# `qrdine` — Campus Self-Order System Blueprint

An end-to-end real-time self-ordering platform for college canteens built with **Node.js, Express, Socket.IO, and Vanilla JavaScript**. It features server-generated QR codes, simulated payment session verification using **SHA256 HMAC tokens**, and instant dual-screen synchronization between the Student Mobile App and the Vendor Kitchen Display System (KDS).

---

## Repository Structure

```text
qrdine/
│
├── server/                        # DEVELOPER 1: Vendor App & Backend Logic
│   ├── package.json
│   ├── .env                       # Local secrets (ignored in Git)
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
│   └── views/
│       └── vendor-dashboard.html  # Kitchen Display System (KDS)
│
└── client/                        # DEVELOPER 2: Student Web App
    ├── package.json
    ├── public/
    │   └── index.html             # Main Student App container
    ├── src/
    │   ├── main.js                # App driver
    │   ├── api.js                 # HTTP calls (Fetch API)
    │   ├── socket.js              # Socket.IO connection & event listeners
    │   ├── components/
    │   │   ├── MenuList.js        # Menu UI component
    │   │   ├── Cart.js            # Cart & subtotal component
    │   │   ├── PaymentModal.js    # QR display & payment simulation button
    │   │   └── ReceiptCard.js     # Final verification token display
    │   └── styles/
    │       └── app.css            # Responsive styles

```

---

## Environment & Setup Rules

### 1. Root `.gitignore` Configuration

Create a `.gitignore` file at the root of the repository:

```text
node_modules/
.env
.DS_Store
Thumbs.db
*.log

```

### 2. Server Environment File (`server/.env`)

Developer 1 creates a `.env` file inside `server/`:

```env
PORT=3000
HASH_SECRET=qrdine_secret_key_2026

```

### 3. Mobile / Local Wi-Fi Testing Setup

When testing the student app on a phone connecting to the server running on a laptop:

* Developer 2 replaces `localhost` in `client/src/api.js` and `client/src/socket.js` with Developer 1's laptop local IP address (e.g., `[http://192.168.1.15:3000](http://192.168.1.15:3000)`).
* Both the laptop and phone **must be connected to the same Wi-Fi network or mobile hotspot**.

---

## Execution Workflow

```text
[Student App]                      [Server / Socket.IO]                  [Vendor Dashboard]
     │                                      │                                    │
     ├─── 1. GET /api/menu ────────────────>│                                    │
     │<── 2. Returns menu JSON ─────────────┤                                    │
     │                                      │                                    │
     ├─── 3. POST /api/order/create ───────>│ (Recalculates price on server)      │
     │<── 4. Returns {orderId, qrCode} ─────┤                                    │
     │                                      │                                    │
     ├─── 5. Socket Join: 'order_123' ─────>│                                    │
     │                                      │<── 6. Socket Join: 'vendor_main' ──┤
     │                                      │                                    │
     ├─── 7. POST /api/order/pay ──────────>│ (Generates SHA256 Hash Token)      │
     │                                      │                                    │
     │<── 8. Emit 'payment_verified' ───────┤ ── 9. Emit 'new_order_alert' ──────>│
     ▼                                                                           ▼
[Show Hash Token on Phone]                                                [Show Order Card on KDS]

```

---

## API & Socket Specifications

### REST Endpoints

| Method | Endpoint | Description | Request Body | Response Payload |
| --- | --- | --- | --- | --- |
| `GET` | `/api/menu` | Fetch active menu | None | `{ success: true, menu: [...] }` |
| `POST` | `/api/order/create` | Validate & issue QR code | `{ items: [{ id, qty }] }` | `{ success: true, orderId, totalAmount, qrDataUrl }` |
| `POST` | `/api/order/pay` | Simulate payment & trigger code | `{ orderId }` | `{ success: true, verificationHash }` |

### Socket.IO Event Map

| Event Name | Direction | Target Room | Payload |
| --- | --- | --- | --- |
| `join_order_room` | Client $\rightarrow$ Server | N/A | `orderId` |
| `join_vendor_room` | Vendor $\rightarrow$ Server | N/A | `"vendor_main"` |
| `payment_verified` | Server $\rightarrow$ Client | `order_<ORDER_ID>` | `{ orderId, verificationHash, items, totalAmount }` |
| `new_order_alert` | Server $\rightarrow$ Vendor | `vendor_main` | `{ orderId, verificationHash, items, totalAmount, paidAt }` |

---

## Key Security & Edge Case Rules

1. **Anti-Price Tampering:** The server recalculates total order prices using `config/menuData.js` instead of trusting total values submitted by the client browser.
2. **Replay Payment Shield:** Calling `POST /api/order/pay` for an already processed order returns `400 Bad Request` with `{ error: "Order already processed" }`.
3. **Socket Reconnection:** If a student's phone temporarily drops network connection, `client/src/socket.js` automatically re-emits `join_order_room` using the stored `currentOrderId`.

---

## How to Run Locally

### Developer 1 (Backend & Vendor Screen)

```bash
cd server
npm install
npm start
# Access Vendor KDS at: http://localhost:3000/vendor-dashboard.html

```

### Developer 2 (Student Client)

```bash
cd client
npm install
npm start
# Access Student App at: http://localhost:8080 (or Live Server link)

```
