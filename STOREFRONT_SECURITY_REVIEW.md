# Storefront / BNPL Checkout — Architecture & Security Review

Scope: the online storefront feature added in the last few commits
("add online store and same modifications").

- `application/frontend/src/features/storefront/Storefront.tsx`
- `application/backend/src/controllers/storefrontController.ts`
- `application/backend/src/middlewares/storeContextMiddleware.ts`
- `application/backend/src/app.ts`
- `application/backend/src/middlewares/authMiddleware.ts`

Overall shape is reasonable (public storefront routes mounted ahead of the
internal auth stack so browsing doesn't require login), but there are real
gaps before this should touch real money.

## Critical — checkout has no actual authentication

`storefrontController.ts` is mounted at `app.ts:34`, *before*
`authMiddleware` / `storeContextMiddleware` (`app.ts:52`). That's correct
for public product browsing, but `/auth/login` returns a customer JWT that
is **never used anywhere**:

- Frontend (`Storefront.tsx:85-87`) just stores `customerId` in React state
  and sends it as a plain field in the checkout body
  (`Storefront.tsx:100`).
- Backend (`storefrontController.ts:108`) trusts `req.body.customerId` with
  zero verification.

Net effect: anyone can pass any customer's UUID and place BNPL orders as
them, or hit `POST /installments/:id/pay` (`storefrontController.ts:227`) —
which has **no auth at all** and doesn't process any actual payment, just
flips `status` to `PAID` — to clear someone else's (or their own) debt for
free.

## Critical — price is client-supplied

`storefrontController.ts:108,135,176`: `item.price` comes straight from
the request body and is used to compute `total`, the invoice, and the BNPL
installment amounts. The server never re-reads `product.sellingPrice` to
verify it. Anyone can submit `price: 0.01` in the checkout payload and buy
anything for a cent.

## High — no transaction, TOCTOU on inventory

The checkout handler does check-then-decrement-then-insert as separate
sequential queries with no `db.transaction()`
(`storefrontController.ts:130-217`). Two concurrent checkouts on the last
unit of a product can both pass the `quantity < item.quantity` check
before either decrements → oversold inventory. A failure partway through
(e.g. invoice insert throws) also leaves inventory already decremented
with no invoice — orphaned state.

## Medium — inconsistent/insecure JWT fallback secrets

`authMiddleware.ts:4` falls back to `'fallback_secret_key_for_dev'`,
`storefrontController.ts:86` falls back to `'secret123'`. Different
strings, both insecure defaults that will silently run in prod if
`JWT_SECRET` isn't set — worth a startup check that fails hard if it's
missing, rather than defaulting.

## Recommendation, in order

1. Have `/checkout` and `/installments/:id/pay` require a verified customer
   session (issue the JWT as an httpOnly cookie like staff auth does,
   verify it server-side, derive `customerId` from the token — never trust
   the body).
2. Recompute price/total server-side from `products.sellingPrice`; ignore
   client-sent `price`.
3. Wrap checkout in `db.transaction()`.
4. Fail startup if `JWT_SECRET` is unset in production.

The UI/UX and the rest of the flow (product listing, cart,
fulfillment/payment selection) is fine — this is purely a "the server
doesn't verify who's asking or what things cost" problem, which is the
part that actually matters for a checkout/BNPL feature.
