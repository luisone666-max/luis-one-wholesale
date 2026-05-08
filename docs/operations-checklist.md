# Luis One Supply Hub Operations Checklist

This checklist is the final run record for ongoing maintenance and feature work.

## Always Run Before Shipping

- `npm.cmd run check:maintenance`

This runs:

- `npm.cmd run lint`
- `npm.cmd run check:customer-safety`
- `npm.cmd run check:pos`
- `npm.cmd run check:loyalty`
- `npm.cmd run check:production`
- `npm.cmd run build`
- Check customer storefront:
  - Home page loads real products.
  - Search works with partial words, SKU, model, and spaced keywords.
  - Price sorting uses product and variant wholesale tiers.
  - Unavailable products cannot be ordered and point customers to Messenger.
  - Product and share page Open Graph tags include product name, PHP pricing text, and absolute HTTPS image.
  - Product pages do not show supplier notes, internal cost notes, or admin notes.
  - Cart, checkout, My Orders, and order detail still work.
- Check admin protection:
  - Logged-out users cannot access `/admin`.
  - Normal customers cannot access `/admin` or `/api/admin/*`.
  - Service role key is only used in server-only files.
- Check sales operations:
  - Sales Desk can create an offline sale.
  - Cashier Center can confirm payment.
  - Cash Drawer reflects cash and transfer totals.
  - Employee monthly sales report loads current month and recent history.
  - Wrong sales slips can be corrected through the approved correction flow.
- Check data safety:
  - No real keys are committed.
  - `.env.local` stays ignored.
  - Customer frontend never exposes admin-only fields.
  - Meta catalog feed has at least 5 products and no duplicate item IDs.

## Run After Production Migrations

- `npm.cmd run check:readiness`

This runs:

- `npm.cmd run check:schema`
- `npm.cmd run check:pos:corrections`
- Current known blocker: run `supabase/migrations/20260507001000_pos_sale_audit_logs.sql` in Supabase SQL Editor so POS correction audit history can be fully verified.

## Business Flow To Keep Improving

- Member points: every PHP 100 paid = 1 point.
- Points are awarded only after payment confirmation.
- Online orders and offline POS sales must not award duplicate points.
- Sales staff should see only the tools they need.
- Cashier should confirm money and payment method, not edit product data.
- Owner/Admin should see full monthly sales, staff performance, cash drawer, product, customer, and order data.
- Customers should browse fast on mobile, search accurately, and use Messenger when stock or delivery needs manual discussion.

## Offline POS Correction Policy

- Sales staff can edit their own sale only while it is still waiting for cashier review or has been returned by cashier.
- Sales staff can cancel their own unpaid waiting sale when they made a mistake.
- Cashier can return a waiting sale to Sales Desk when price, item, customer, or payment details need correction.
- Cashier confirms payment only after money is received by cash, GCash, bank transfer, or another approved method.
- Paid sales should not be hard deleted.
- If a paid sale is wrong, Owner/Admin must void it with a reason. The system keeps the audit trail, reverses the payment record, and reverses loyalty points when needed.
- Owner/Admin reviews cancelled, returned, and voided sales in Reports so daily totals stay trustworthy.
- Owner/Admin can unlock Owner Center to review the latest sensitive admin action logs for products, categories, online orders, and staff access.
- Run `supabase/migrations/20260508001000_admin_action_audit_logs.sql` in production so sensitive admin action history is fully active.
- Physical cash in the drawer is only cash payments. GCash and bank transfer are shown separately in Cash Drawer totals.

## Next Improvement Backlog

- Run `supabase/migrations/20260507001000_pos_sale_audit_logs.sql` in production so POS correction audit history is fully active.
- Add clearer owner/admin monthly report filters after more real staff data is collected.
- Keep improving mobile catalog density without making buttons overlap product names or prices.
