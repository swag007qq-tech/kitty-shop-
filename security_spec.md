# Security Specification — KITTY SHOP Firestore Rules

## 1. Data Invariants
1. All product catalog items (`/products/{productId}`) must have a valid ID (`^[a-zA-Z0-9_-]+$`), valid `game` (`'adopt-me'` or `'mm2'`), bounded `title` (`1..140`), non-negative integer `stock`, valid `prices` map with at least one supported currency (`UAH`, `STARS`, `ROBUX`), and server timestamps (`createdAt == request.time`, `updatedAt == request.time`).
2. `Adopt Me` items must declare 1 to 4 rarities from `['M', 'N', 'F', 'R']`. `MM2` items may optionally include a bounded `subtitle` (`<= 200` chars).
3. Public storefront reads (`products`, `product_images`, `catalog_meta`) expose zero PII and require no authentication so any visitor across all devices can browse the live catalog.
4. All writes (`create`, `update`, `delete`) across `products`, `product_images`, `catalog_meta`, and `admins` are strictly restricted to verified shop admins (`isAdmin()`), preventing unauthorized catalog tampering.
5. `createdAt` is immutable on update (`incoming().createdAt == existing().createdAt`) and `id` must match path `{productId}` / `{imageId}`.

## 2. "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated `create` on `/products/cow-1`
2. Authenticated non-admin (`random@gmail.com`) `create` on `/products/cow-1`
3. Unverified admin email (`email_verified: false`) `create` on `/products/cow-1`
4. Shadow field injection (`isFeatured: true`) on `/products/cow-1`
5. Client-forged `createdAt` timestamp on `create`
6. Mutating `createdAt` during `update` on `/products/cow-1`
7. Negative stock (`stock: -5`) or non-integer price
8. Empty prices map (`prices: {}`) or unsupported currency (`RUB: 100`)
9. Oversized `title` (`> 140` chars) or invalid document ID (`../../etc/passwd`)
10. `adopt-me` product with empty `rarities: []` or > 4 elements
11. Unauthenticated or non-admin `delete` on `/products/cow-1`
12. Non-bootstrapped user attempting to create `/admins/{uid}` to escalate privileges
