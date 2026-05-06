# Luis One Supply Hub Operations Flow

This document explains how the live store, offline POS, cashier, cash drawer, and owner reports connect.

## Staff Links

- Customer website: `https://luisonesupplyhub.com`
- Admin login: `https://luisonesupplyhub.com/admin/login`
- Product price lookup / product management: `/admin/products`
- Offline sales desk: `/admin/sales-desk`
- Offline cashier: `/admin/cashier`
- Cash drawer: `/admin/cash-drawer`
- Owner reports: `/admin/reports`
- Staff access: `/admin/staff`

## Role Rules

- Owner: full access, reports, staff, products, online orders, POS, cashier, cash drawer.
- Admin: store management access, staff, products, reports, orders, POS, cashier, cash drawer.
- Sales / Staff: sales desk and product price lookup only.
- Cashier: cashier center and cash drawer only.
- Warehouse: product/order handling only.

Sales or staff users cannot confirm their own payments in the cashier center.

## Offline POS Flow

1. Salesperson opens `/admin/sales-desk`.
2. Salesperson enters or selects the customer.
3. If the customer is a member, select the customer account so points can be awarded after payment.
4. Salesperson adds product rows, quantity, selling price, discount, and payment method.
5. Salesperson clicks `Save and Send to Cashier`.
6. The sale status becomes `waiting_cashier`.
7. Cashier opens `/admin/cashier`.
8. Cashier checks the sale slip, payment method, amount, and items.
9. Cash payment: cashier counts the cash and confirms.
10. GCash / bank transfer: cashier verifies the transfer and enters the reference number before confirming.
11. After confirmation, the sale status becomes `paid`.
12. Member points are awarded automatically at `PHP 100 = 1 point`.
13. Cash drawer and reports update from confirmed payments.

## Cash Drawer Rules

- Cash drawer is for offline POS cashier-confirmed payments only.
- Cash payments increase expected physical cash.
- GCash and bank transfers are shown separately and do not increase physical cash.
- Expected cash = opening cash + confirmed cash payments + cash-in adjustments - cash-out entries.
- Online website orders are handled in Online Orders / Payments, not in the cash drawer.

## Owner Reports

Owner reports show:

- Today sales total.
- This month sales total.
- Online submitted orders.
- Offline POS slips.
- Online confirmed payments.
- Offline cashier-confirmed payments.
- Cash / GCash / bank transfer totals.
- Employee monthly sales.

## Customer Order Rules

- Products and prices remain public.
- Unavailable products can stay visible on the customer website.
- Unavailable products or unavailable variants cannot be added to cart or submitted through checkout.
- Customers should use Messenger for unavailable items, special orders, colors, and temporary stock negotiation.
- Variant selection controls the displayed image, SKU, MOQ, stock status, and wholesale price tiers.
- Products without variants continue to use the main product image, MOQ, stock status, and wholesale price tiers.

## Member Points Rules

- Every registered customer is treated as a member.
- Points rule: `PHP 100 paid = 1 point`.
- Online orders earn points only after admin marks payment as fully paid.
- Offline store sales earn points only after cashier confirms payment.
- Walk-in customers can earn points if sales staff selects their customer/member record during offline sale creation.
- Test POS maintenance checks create and clean temporary loyalty data automatically.

## Role Operating Rules

- Sales staff should use `/admin/sales-desk` for offline slips and `/admin/products` only for price lookup.
- Cashier should use `/admin/cashier` to confirm waiting slips and `/admin/cash-drawer` to monitor the daily cash drawer.
- Owner/admin should use `/admin/reports` for online, offline, cash, transfer, waiting, and employee totals.
- Product creation, editing, hiding, deleting, and upload actions are reserved for product managers, admins, or owner-level users.

## Maintenance Check

Run these before deployment:

```bash
npm run check:pos
npm run lint
npm run build
```

`npm run check:pos` creates a temporary offline sale, confirms cashier payment, verifies loyalty points and cash drawer source totals, then removes the test data.
