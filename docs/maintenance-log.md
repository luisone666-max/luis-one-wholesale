# Maintenance Log

## 2026-05-06

- Added final operations checklist in `docs/operations-checklist.md`.
- Added real loyalty point awarding flow:
  - Online order marked `fully_paid` awards member points.
  - Offline POS sale confirmed by cashier awards member points.
  - Same source order/sale cannot award points twice.
- Added customer-facing member card on My Orders.
- Replaced mock Admin Customers page with real customer records, order count, paid spend, and points columns.
- Improved catalog fallback messaging so customers do not see technical Supabase/mock-data wording.
- Updated employee monthly sales report to include both online assigned orders and offline POS sales.
- Replaced mock Admin Payments page with real online payment records and offline cashier confirmations.
- Removed duplicate mock wholesale price page from admin navigation; old URL redirects to Products.
- Updated Admin Settings placeholders to real Luis One Supply Hub contact details.
- Improved Sales Desk product selection with SKU/name search and limited dropdown results.
- Admin order detail now prefers variant image and variant stock status when an order item has a selected variant.
- Admin dashboard now includes total customers and active customers.
- Added loyalty points history:
  - Customers can see recent points activity on My Orders.
  - Admin Customers can expand a customer row to inspect points transactions.
  - Points history API is admin/owner protected.
- Strengthened unavailable product handling:
  - Product detail blocks direct add-to-order for unavailable products and variants.
  - Cart blocks checkout when an item needs Messenger confirmation.
  - Checkout disables Place Order if a cart item cannot be priced or is unavailable.
  - Server-side order submission also rejects unavailable products and variants.
- Tightened role-based POS access:
  - Cash Drawer page and API now require cashier/admin/owner.
  - Sales Desk page now requires sales/staff/admin/owner.
  - This keeps sales users out of cashier tools and keeps cashier users out of sales-slip creation.
- Improved deployment stability and product freshness:
  - Product detail pages now render on demand instead of prebuilding every product at deploy time.
  - Product share pages now render on demand instead of prebuilding every product at deploy time.
  - Static generation count dropped from 561 pages to 73 pages in the verified build.
  - Product/category updates also revalidate share pages, Meta catalog feed, and sitemap.
- Tightened sales product lookup privacy:
  - Sales/staff product lookup receives a limited product record for price checking.
  - Supplier notes, internal cost notes, and admin notes are not serialized into the sales lookup page.
  - `/api/admin/products` returns limited product data for sales/staff and blocks unrelated roles.
- Improved variant image management:
  - Variant editor now shows a per-variant image preview.
  - Variant image upload is clearer and variant image can be cleared without touching the main product image.
  - Customers still see the variant image after selecting that variant.
- Customer frontend language scan:
  - No Chinese text was found in customer-facing app/components during the latest scan.
  - Chinese matches were limited to admin translation files.
- POS sales API role access tightened:
  - Sales/staff can create offline sales.
  - Cashier/admin/owner can view waiting cashier sales.
  - Sales/staff cannot fetch all cashier-waiting sales through the API.
- POS sales statistics tightened:
  - Sales Desk today/month totals now count cashier-confirmed paid sales only.
  - Waiting cashier slips remain visible as a separate amount and count.
  - Sales Desk Chinese labels are readable for staff training.
- Owner report protection and clarity:
  - Reports page now requires owner/admin role.
  - Reports now show both selected sales total and selected paid total.
  - Reports clarify that paid totals only include confirmed online payments and cashier-confirmed offline payments.
- Admin role landing improved:
  - `/admin` now sends sales/staff to Sales Desk, cashier to Cashier Center, warehouse to Products, and owner/admin to Dashboard.
  - This keeps each employee role focused on the screen they actually need.
- Sales Desk employee attribution improved:
  - Current admin employee number is now used as the default sales employee number when available.
  - The Sales Desk client no longer receives the full staff user list unnecessarily.
- Customer catalog sorting improved:
  - Product listing `Latest` sort now uses real product `created_at` when Supabase provides it instead of sorting by slug.
- Admin product upload flow improved:
  - Editing products no longer auto-fills four default wholesale tiers when none exist.
  - Staff can add only the wholesale tiers they need.
  - Product management Chinese workflow labels are readable.
- Variant order safety improved:
  - Product detail no longer auto-selects the first variant.
  - Customers must intentionally select a variant/model before adding a variant product to the order list.
- Dashboard readability improved:
  - Admin dashboard Chinese labels are now readable for owner review.
  - Dashboard now explains that offline sales totals count cashier-confirmed payments, while online order value is still manually confirmed.
- Admin language cleanup:
  - Seller Center sidebar Chinese section names and hints are now readable.
  - Common admin translation keys now use a clean Chinese override instead of garbled legacy strings.
- Product role access tightened:
  - Sales/staff still get a product price lookup page only.
  - Owner/admin/warehouse can manage products.
  - Other roles are redirected away from `/admin/products` instead of seeing product management.
  - Sales product lookup Chinese labels are now readable.
- Offline cashier and cash drawer clarity:
  - Cashier Center Chinese labels are now readable.
  - Confirming an offline payment tells cashier that Cash Drawer totals update automatically.
  - Cash Drawer Chinese labels are now readable.
  - Cash Drawer clearly separates physical cash from GCash / bank transfer totals.
- Reports readability:
  - Monthly employee sales report Chinese labels are now readable.
  - Report note uses the same data definition as Dashboard and Cash Drawer: valid sales vs confirmed paid sales.
- Warehouse role landing aligned:
  - Warehouse users now consistently land on Online Orders for picking/packing instead of switching between Products and Orders.
- Loyalty rule check:
  - Online and offline member points both use `Every PHP 100 = 1 point`.
  - Points are awarded only after online payment confirmation or offline cashier confirmation.
- Route and safety check:
  - Local homepage, all-products category, sitemap, and Meta catalog feed returned 200.
  - Customer-facing app/components scan found no `supplier_notes`, `internal_cost_notes`, or `admin_notes`.
  - Source scan found no committed Supabase service role or secret token strings in `src`.
- Supabase CLI check:
  - CLI is available.
  - Remote project is not linked in this environment because no Supabase access token is configured.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Admin role navigation cleanup:

- Confirmed admin navigation is already role-filtered:
  - Owner/admin see full management, reports, settings, staff, customers, and payments.
  - Sales/staff see Sales Desk and product price lookup only.
  - Cashier sees Cashier Center and Cash Drawer only.
  - Warehouse sees product management and online orders.
- Cleaned garbled Chinese labels in the admin shell navigation and dashboard overview.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Admin customer loyalty management follow-up:

- Customer management now uses clean English/Chinese labels for member points.
- Admin/owner can expand a customer and review loyalty point history.
- Added protected manual points adjustment from the customer page:
  - Positive values add points.
  - Negative values deduct points.
  - Adjustment note is required.
  - Customer balance cannot go below zero.
  - Every manual adjustment creates a loyalty transaction with `manual_adjustment` source.
- Lifetime points only increase when points are added, not when points are deducted.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Variant image workflow follow-up:

- Confirmed product variants can already store their own image URL and customer product detail swaps to the selected variant image.
- Product detail now clearly indicates when a selected variant has no dedicated image yet.
- Admin product editor now shows clearer variant image upload status.
- Variant image upload disables duplicate upload/save actions while the upload is running.
- Admin editor now explains that a variant without its own image uses the main product image until updated.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Unavailable product inquiry follow-up:

- Product detail pages now keep unavailable products visible but replace direct ordering with a Messenger availability inquiry action.
- Mobile sticky action bar uses one clear Ask Availability on Messenger button for unavailable products.
- Existing cart and checkout protections remain unchanged:
  - Unavailable products cannot be added to cart.
  - Existing cart items that become unavailable block checkout and ask the customer to contact Messenger.
  - Server-side order submission still rejects unavailable products or variants.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Customer member center follow-up:

- Added a dedicated customer-facing `/member` page.
- The member page shows:
  - Member name, phone, and business type.
  - Available points and lifetime points.
  - Rule: every PHP 100 paid = 1 point.
  - Recent online/offline points activity.
  - Continue Shopping, My Orders, and Messenger actions.
- Added Member Card links to the customer header and footer.
- Updated points source display so POS sales show as Offline sale.
- No database schema, cart, checkout, admin, or payment logic was changed.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Offline POS follow-up:

- Sales Desk now shows recent sales slips so each salesperson can see their own recent orders and owner/admin can review store POS slips.
- Sales Desk refreshes recent sales after a new offline slip is saved.
- `/api/admin/pos/sales?scope=mine` lets sales/staff view only their own offline sales while cashier/admin/owner can still review cashier queues.
- Cashier confirmation now validates that the confirmed amount matches the sale amount before marking a sale as paid.
- GCash and bank transfer POS payments now require a reference number before cashier confirmation.
- Seller Center sidebar, Sales Desk, Cashier Center, and Cash Drawer Chinese labels were cleaned up for readable admin operation.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.
  - Unauthenticated `/admin`, `/admin/sales-desk`, `/admin/cashier`, and `/admin/cash-drawer` redirected.
  - Unauthenticated `/api/admin/pos/sales` and `/api/admin/cash-drawer` returned 403.

Owner reports follow-up:

- Reports now include an owner-focused overview:
  - Today sales total.
  - Today collected / paid total.
  - Today online submitted order value.
  - Today offline POS slip value.
  - Today online confirmed paid value.
  - Today offline cashier-confirmed paid value.
  - Today waiting cashier amount and count.
  - Today pending online order amount and count.
  - This month sales total.
  - This month collected / paid total.
  - This month online/offline split.
  - This month cash, GCash, bank transfer, and other payment totals.
- Employee monthly sales table remains available and now sits under the owner overview.
- Reports Chinese labels were cleaned up for owner/admin use.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.
  - Unauthenticated `/admin/reports` redirected.
  - Unauthenticated `/api/admin/pos/sales` returned 403.

A6 print template follow-up:

- Existing online order detail print remains available as A6 order slip.
- Added A6 offline POS sales slip template for door sales.
- Sales Desk recent sales now includes a Print A6 action.
- Cashier Center waiting sales now includes a Print A6 action before payment confirmation.
- POS A6 slip includes:
  - Store name, address, phone, and hours.
  - Sale number, created date, and status.
  - Customer name, phone, and member flag.
  - Salesperson, employee number, and payment method.
  - Product rows with SKU, item, quantity, unit price, and subtotal.
  - Product total, discount, and amount due.
  - Cashier checklist and signature areas.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.
  - Unauthenticated `/admin/sales-desk`, `/admin/cashier`, and `/admin/orders` redirected.
  - Local homepage returned 200.
  - Local category page returned 200.
  - Local product page returned 200.
  - Local share product page returned 200.
  - Local sitemap returned 200.
  - Local Meta catalog feed returned 200.
  - Unauthenticated `/api/admin/products` returned 403.
  - Unauthenticated `/api/admin/cash-drawer` returned 403.
  - Unauthenticated `/admin/products` redirected to `/admin/login`.
  - Local `/dev/supabase-test` returned 200 in development; production proxy keeps it hidden.

Manual database setup status:

- `supabase/migrations/20260506007000_customer_loyalty_points.sql` has been run in Supabase SQL Editor.
- Supabase CLI still cannot push from this machine until `supabase login` or `SUPABASE_ACCESS_TOKEN` is configured.

Post-migration checks:

- `customers.points_balance` exists.
- `customers.lifetime_points` exists.
- `customer_loyalty_point_transactions` exists.
- Reversible offline POS test passed:
  - Created a maintenance test sale.
  - Confirmed cash payment.
  - Loyalty RPC awarded 1 point for PHP 100.
  - Customer points increased during the test.
  - Maintenance test sale, payment, and points transaction were cleaned up successfully.
- Reversible online order loyalty test passed:
  - Created a maintenance test online order.
  - Marked it fully paid.
  - Loyalty RPC awarded 2 points for PHP 200.
  - Re-running the same award did not duplicate points.
  - Maintenance test order and points transaction were cleaned up successfully.

Final post-migration maintenance check:

- `.env.local` is ignored by git through `.gitignore`.
- `.env.example` contains variable names only and no real values.
- `/dev/supabase-test` is development-only and active-admin protected.
- Customer-facing app/components scan found no display of `supplier_notes`, `internal_cost_notes`, or `admin_notes`.
- Service-role key usage is limited to server/config/API paths; no secret value was printed.
- Route smoke check:
  - `/`, `/category/all`, `/product/1`, `/cart`, `/checkout`, `/my-orders`, `/meta/catalog-feed.csv`, and `/sitemap.xml` returned 200 locally.
  - Unauthenticated `/admin` redirected.
  - Unauthenticated `/api/admin/products`, `/api/admin/pos/sales`, and `/api/admin/cash-drawer` returned 403.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Customer search follow-up:

- Search form now normalizes repeated spaces before opening the product listing page.
- Product listing search now understands more reseller-friendly terms and common typing differences:
  - `top box` / `topbox`
  - `key set` / `keyset`
  - `brake` / `break`
  - `n max` / `NMAX`
  - helmet-related words such as `helmet`, `visor`, `half`, `full`, `modular`, `HNJ`, `Gille`, and `Zebra`
- Product listing search now includes variant name, variant SKU, model, and fitment text.
- Multi-word searches get stronger ranking when every typed word matches.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Mobile product listing price follow-up:

- Product cards keep the desktop PHP price display.
- Mobile product cards now use a shorter peso display such as `₱120+` and `6-11 pcs from ₱140`.
- Retail price on mobile also uses a shorter peso display to reduce wrapping.
- The existing product detail, cart, checkout, and order logic were not changed.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Admin product upload wording follow-up:

- Product editor save/upload wording is clearer for product creation.
- Product editor success dialog now follows the selected admin language.
- Save button loading text now follows the selected admin language.
- Image-selected hints now tell the user that selected images are uploaded when saving the product.
- Product list refresh behavior was not changed; product APIs still revalidate catalog pages after create/update.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Reseller image download follow-up:

- Product detail reseller image downloads now label images by purpose:
  - Main image
  - Gallery image
  - Variant name and variant SKU when the image belongs to a variant
- Placeholder SVG product images are excluded from reseller downloads.
- Download links still use the original image URL, not a compressed thumbnail.
- Product description remains above reseller image downloads.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Cash drawer visibility follow-up:

- Cash Drawer now always shows today confirmed offline sales summary at the top:
  - Offline sales total
  - Cash received
  - GCash / bank transfer total
  - Expected physical cash
- This summary appears even before the daily cash drawer session is opened, so confirmed cashier payments are easier to notice.
- The physical cash box formula stays unchanged: opening cash + confirmed cash payments + cash-in adjustments - cash-out entries.
- Cashier confirmation API remains restricted to cashier, admin, or owner roles.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Offline sales employee control follow-up:

- Sales/staff users can no longer create POS sales using another employee number.
- Owner/admin can still create or correct POS slips for staff when needed.
- Cashier confirmation remains separate from sales slip creation.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Offline sales product search follow-up:

- Sales Desk product search now supports multiple keywords and compact model typing.
- Examples now work better:
  - `n max` can match NMAX text.
  - `top box` can match topbox text.
  - `key set` can match keyset text.
  - `break` can still find brake text.
- This only changes the product picker search in the offline sales desk; POS save/payment logic was not changed.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.

Staff management page protection follow-up:

- Staff management page now uses the shared owner/admin permission check.
- Sales, cashier, warehouse, and staff roles cannot load staff user data from the page.
- Staff management APIs were already owner/admin protected; this aligns the page with the API.
- Verification:
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed.
