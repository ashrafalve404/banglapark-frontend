# Bangla Park Limited --- Logic Verification Checklist (Enterprise Edition)

> Production QA checklist for Bangla Park MLM + E-commerce Platform.

## 1. Registration & Activation

-   Registration is FREE.
-   New account status = `INACTIVE`.
-   Generate unique `referral_code` and `referral_link` immediately.
-   User becomes ACTIVE only after:
    -   Qualifying order \>= BDT 2000
    -   Payment completed (or COD successfully delivered)
    -   Order status = `DELIVERED`
-   Save:
    -   `active_from = delivered_at`
    -   `active_until = delivered_at + 30 days`
-   Cron job expires accounts automatically.
-   Re-activation requires another qualifying delivered order.
-   Reactivation never pays generation commission.
-   Clarify with client whether purchasing while already active extends
    current expiry or resets from delivery date.
-   Cancelled orders never activate accounts.

## 2. Referral

-   One sponsor per user.
-   Unlimited direct referrals.
-   Sponsor cannot change after registration (except optional admin
    override).
-   Referral code must be UNIQUE.
-   Users without sponsors are supported.

## 3. Generation Commission

-   Paid ONLY on first qualifying activation.
-   Trigger only after Delivered.
-   Maximum 10 levels.
-   BDT 200 per eligible active sponsor.
-   Skip inactive sponsors.
-   Never retry duplicate payouts.
-   Execute activation + payouts + wallet logs inside one DB
    transaction.

## 4. Daily Benefit

Count ACTIVE members across the full downline (confirm with client).
Only ACTIVE users receive benefits.

    Active Team   Daily Benefit
  ------------- ---------------
              5             100
             20             200
             50             300
            100             500
            500            1000
           5000            2000
          10000            5000

Rules: - Highest matching tier only. - Run once every 24 hours. -
Idempotent (cannot pay twice for same day). - Store wallet transaction
and benefit log.

## 5. Wallet

-   All balance updates go through WalletService.
-   Never update balance directly.
-   Every transaction stores:
    -   type
    -   amount
    -   balance_after
    -   reference_id
    -   description
    -   timestamp
-   Balance must never become negative.

## 6. Withdrawal

-   Minimum 1000 BDT.
-   Methods:
    -   bKash
    -   Nagad
    -   Rocket
    -   Bank
-   Pending requests do NOT deduct balance.
-   Approval deducts balance.
-   Reject requires reason.
-   Prevent multiple pending requests exceeding available balance.

## 7. Orders

Status flow: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED

CANCELLED may occur before delivery.

Business events only after DELIVERED: - Activation - Generation
commission - Wallet credit

Delivered orders become immutable.

## 8. User Dashboard

-   Activation countdown
-   Wallet
-   Transactions
-   Orders
-   Referral stats
-   Daily benefit history
-   Generation income history
-   Withdraw
-   Notifications

## 9. Admin Dashboard

-   User Management
-   Products
-   Categories
-   Orders
-   Wallet
-   Withdraw Approval
-   Commission Rules
-   Daily Benefit Rules
-   Reports
-   Analytics
-   Audit Logs

Every admin action must be logged.

## 10. Notifications

-   Registration
-   Activation
-   Activation Expiry Reminder
-   Daily Benefit
-   Generation Commission
-   Withdraw Submitted
-   Withdraw Approved
-   Withdraw Rejected
-   Order Delivered

## 11. Database

-   UUID primary keys
-   Foreign keys
-   Indexes
-   Soft Delete (`deleted_at`)
-   Audit fields
-   Transactions

## 12. Security

-   JWT + Refresh Token
-   Argon2 Password Hashing
-   RBAC
-   Helmet
-   Rate Limiting
-   Validation
-   XSS Protection
-   SQL Injection Protection
-   Input Sanitization

## 13. Audit Logging

Log all financial/admin actions with: - User/Admin ID - IP - Device -
Timestamp - Reference ID

## 14. Configurable Settings

Store in database: - Generation Commission Amount - Daily Benefit
Tiers - Activation Amount - Activation Days - Withdraw Minimum

Never hardcode business values.

## 15. Performance

-   Redis caching
-   Cron jobs
-   Queue/BullMQ for heavy jobs
-   Batch processing
-   Pagination
-   Lazy loading

## 16. Final Edge Cases

-   No sponsor
-   Less than 10 uplines
-   Duplicate delivery events
-   Duplicate cron execution
-   Double-click checkout
-   Double withdraw requests
-   Concurrent wallet updates
-   Refund policy (define if future support required)
