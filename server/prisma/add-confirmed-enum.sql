-- Add CONFIRMED to PartnerPaymentStatus enum (required for partner/admin confirm-payment)
-- Run once. If CONFIRMED already exists, you may see an error; that's OK.
ALTER TYPE "PartnerPaymentStatus" ADD VALUE 'CONFIRMED';
