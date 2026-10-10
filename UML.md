Here is the complete UML modeling reference for **`qrdine`**, covering all seven core diagrams. You can use these specifications directly in tools like PlantUML, Mermaid.js, StarUML, or Draw.io.

---

## 1. Use Case Diagram

### Entities (Actors)

* **Student:** Browses menu, places order, scans QR, simulates payment, presents receipt token.
* **Vendor / Kitchen Staff:** Views incoming live orders, verifies student token, updates order status (Preparing / Ready / Picked Up).
* **System / Timer (Secondary Actor):** Handles session timeouts for unpaid orders.

### Use Cases & Relationships

* **UC1: Fetch Menu** — Student
* **UC2: Place Order** — Student
* **UC3: Generate Payment QR** — Student `<<include>>` UC2
* **UC4: Simulate Payment** — Student
* **UC5: Generate Verification Token** — System `<<extend>>` UC4
* **UC6: Broadcast Real-Time Order** — System `<<include>>` UC5
* **UC7: View Live Kitchen Display** — Vendor
* **UC8: Verify Receipt Code** — Vendor `<<include>>` UC7
* **UC9: Update Order Status** — Vendor

---

## 2. Activity Diagram

### Components & Control Nodes

* **Initial Node:** `(●)` Start
* **Activity States:**
* Fetch & Render Menu
* Select Items & Request Checkout
* Recalculate Total & Generate `orderId`
* Render Payment QR Code & Join Socket Room
* Trigger Payment Simulation
* Compute SHA256 Verification Token
* Emit Dual Socket Events (`payment_verified` & `new_order_alert`)
* Render Receipt Code (Student) / Render KDS Card (Vendor)
* Match Token at Counter


* **Decision Nodes:**
* `< Is Item Available? >` $\rightarrow$ Yes: Continue / No: Prompt Error.
* `< Is Order Already Paid? >` $\rightarrow$ Yes: Abort Replay / No: Generate Token.
* `< Tokens Match at Counter? >` $\rightarrow$ Yes: Hand over food / No: Reject request.


* **Fork & Join Nodes:** Parallel socket broadcast to Student and Vendor rooms.
* **Final Node:** `(◉)` End

---

## 3. Sequence Diagram

### Lifelines (Objects)

1. `:StudentApp` (`client/src/main.js`, `api.js`)
2. `:SocketClient` (`client/src/socket.js`)
3. `:OrderController` (`server/controllers/orderController.js`)
4. `:HashUtil` (`server/utils/hashGenerator.js`)
5. `:SocketServer` (`server/sockets/socketHandler.js`)
6. `:VendorKDS` (`server/views/vendor-dashboard.html`)

### Messages & Call Sequence

1. `GET /api/menu` $\rightarrow$ `:OrderController`
2. `return menu JSON` $\leftarrow$ `:OrderController`
3. `POST /api/order/create {items}` $\rightarrow$ `:OrderController`
4. `recalculateTotal()` $\rightarrow$ self call on `:OrderController`
5. `return {orderId, qrDataUrl}` $\leftarrow$ `:OrderController`
6. `emit("join_order_room", orderId)` $\rightarrow$ `:SocketServer`
7. `emit("join_vendor_room")` (from `:VendorKDS`) $\rightarrow$ `:SocketServer`
8. `POST /api/order/pay {orderId}` $\rightarrow$ `:OrderController`
9. `generateVerificationHash(orderId, amount)` $\rightarrow$ `:HashUtil`
10. `return token` $\leftarrow$ `:HashUtil`
11. `io.to("order_ID").emit("payment_verified", payload)` $\rightarrow$ `:SocketServer` $\rightarrow$ `:StudentApp`
12. `io.to("vendor_main").emit("new_order_alert", payload)` $\rightarrow$ `:SocketServer` $\rightarrow$ `:VendorKDS`

---

## 4. State Machine Diagram (Order Lifecycle)

### States

* **`CREATED` / `PENDING_PAYMENT`:** Initial state after `POST /api/order/create`.
* **`PAID` / `VERIFIED`:** State after successful `POST /api/order/pay` and SHA256 token generation.
* **`PREPARING`:** Vendor acknowledges order on KDS.
* **`READY_FOR_PICKUP`:** Kitchen marks order as cooked.
* **`COMPLETED`:** Student token matched; order handed over.
* **`EXPIRED` / `CANCELLED`:** Unpaid order times out or fails validation.

### Transitions & Triggers

* `CREATED` $\xrightarrow{\text{Trigger: Payment Simulated}}$ `PAID`
* `CREATED` $\xrightarrow{\text{Trigger: Timeout (15 mins)}}$ `EXPIRED`
* `PAID` $\xrightarrow{\text{Trigger: Vendor Accepts}}$ `PREPARING`
* `PREPARING` $\xrightarrow{\text{Trigger: Food Ready}}$ `READY_FOR_PICKUP`
* `READY_FOR_PICKUP` $\xrightarrow{\text{Trigger: Token Matched}}$ `COMPLETED`

---

## 5. Component Diagram

### Components & Interfaces

```text
 ┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
 │          CLIENT SYSTEM               │     │            VENDOR SYSTEM             │
 │  ┌────────────────────────────────┐  │     │  ┌────────────────────────────────┐  │
 │  │        Student Web App         │  │     │  │     Kitchen Display (KDS)      │  │
 │  └───────────────┬────────────────┘  │     │  └───────────────┬────────────────┘  │
 └──────────────────┼───────────────────┘     └──────────────────┼───────────────────┘
                    │ REST / Sockets                             │ REST / Sockets
                    ▼                                            ▼
 ┌───────────────────────────────────────────────────────────────────────────────────┐
 │                                  SERVER SYSTEM                                    │
 │  ┌──────────────────┐    ┌──────────────────┐    ┌─────────────────────────────┐  │
 │  │  menuController  │    │ orderController  │    │       socketHandler         │  │
 │  └────────┬─────────┘    └────────┬─────────┘    └──────────────┬──────────────┘  │
 │           │                       │                             │                 │
 │           ▼                       ▼                             │                 │
 │  ┌──────────────────┐    ┌──────────────────┐                   │                 │
 │  │   menuData.js    │    │  hashGenerator   │<──────────────────┘                 │
 │  └──────────────────┘    └──────────────────┘                                     │
 └───────────────────────────────────────────────────────────────────────────────────┘

```

---

## 6. Deployment Diagram

### Nodes & Communication Protocols

* **`Node: Student Mobile Device`**
* **Artifact:** Web Browser (Executing `client/` app)
* **Protocol:** HTTP / WebSockets over Wi-Fi


* **`Node: Application Server`** (Vendor Laptop / Server)
* **Artifact:** Node.js Runtime (`server.js`)
* **Artifact:** Express.js API Engine & Socket.IO WebSockets Server
* **Port:** `3000`


* **`Node: Kitchen Display Screen`** (Vendor Tablet / PC Browser)
* **Artifact:** Web Browser executing `vendor-dashboard.html`
* **Protocol:** WebSockets over Local Network (`ws://<SERVER_IP>:3000`)



---

## 7. Entity-Relationship (ER) Diagram

Since `qrdine` currently uses an in-memory datastore (Map) or relational database (PostgreSQL/Supabase), here are the structural entities, attributes, and relationships.

### Entities & Attributes

#### `MENU_ITEM`

* `id` (PK, String) — e.g., `"m1"`
* `name` (String) — e.g., `"Cold Coffee"`
* `price` (Decimal) — e.g., `50.00`
* `available` (Boolean) — e.g., `true`

#### `ORDER`

* `order_id` (PK, String) — e.g., `"ORD_171000123"`
* `total_amount` (Decimal) — e.g., `130.00`
* `status` (Enum) — `['PENDING_PAYMENT', 'PAID', 'COMPLETED', 'CANCELLED']`
* `verification_hash` (String, Unique, Nullable) — e.g., `"CANTEEN-8F3A2B91"`
* `created_at` (Timestamp)
* `paid_at` (Timestamp, Nullable)

#### `ORDER_ITEM` (Junction Table)

* `id` (PK, Integer)
* `order_id` (FK $\rightarrow$ `ORDER.order_id`)
* `menu_item_id` (FK $\rightarrow$ `MENU_ITEM.id`)
* `quantity` (Integer)
* `unit_price` (Decimal)

### Cardinality & Relationships

* **`ORDER` to `ORDER_ITEM`:** $1 : N$ (One order contains one or many order line items).
* **`MENU_ITEM` to `ORDER_ITEM`:** $1 : N$ (One menu item can appear across multiple order line items).
