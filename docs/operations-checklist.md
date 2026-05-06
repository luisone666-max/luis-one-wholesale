# Luis One Supply Hub Operations Checklist

This checklist is the final run record for ongoing maintenance and feature work.

## Always Run Before Shipping

- `npm.cmd run lint`
- `npm.cmd run build`
- Check customer storefront:
  - Home page loads real products.
  - Search works with partial words, SKU, model, and spaced keywords.
  - Unavailable products cannot be ordered and point customers to Messenger.
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
  - Employee monthly sales report loads.
- Check data safety:
  - No real keys are committed.
  - `.env.local` stays ignored.
  - Customer frontend never exposes admin-only fields.

## Business Flow To Keep Improving

- Member points: every PHP 100 paid = 1 point.
- Points are awarded only after payment confirmation.
- Online orders and offline POS sales must not award duplicate points.
- Sales staff should see only the tools they need.
- Cashier should confirm money and payment method, not edit product data.
- Owner/Admin should see full monthly sales, staff performance, cash drawer, product, customer, and order data.
- Customers should browse fast on mobile, search accurately, and use Messenger when stock or delivery needs manual discussion.

## Next Improvement Backlog

- Run the remaining Supabase migrations in production before relying on loyalty, staff, POS, and cash drawer data.
- Add a simple staff training page explaining:
  - Sales Desk creates the sale.
  - Cashier Center confirms the money.
  - Cash Drawer summarizes physical cash, GCash, and bank transfer.
  - Reports show monthly staff performance.
- Add clearer owner/admin monthly report filters after real staff data is stable.
- Add a customer-facing “How to order” page focused on pickup, Messenger confirmation, GCash/bank transfer, Lalamove/courier, and no online payment.
- Keep improving mobile catalog density without making buttons overlap product names or prices.
