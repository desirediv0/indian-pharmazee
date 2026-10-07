/**
 * Printable order invoice (opened from the admin panel; print / save as PDF).
 * Works for any order, whichever courier ships it.
 */

import { getStoreConfig } from "./storeConfig.js";
import { escapeHtml, formatMoney, printableDocument } from "./html.js";

const PAYMENT_LABELS = {
    CASH: "Cash on Delivery",
};

const paymentLabel = (method) =>
    PAYMENT_LABELS[method] || (method ? "Paid online" : "—");

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    });
};

// A billing address saved as JSON may use slightly different keys
const addressLines = (address) => {
    if (!address) return [];
    const street = address.street || address.address || address.address1 || "";
    const pin = address.postalCode || address.pincode || address.zip || "";
    const cityLine = [address.city, address.state].filter(Boolean).join(", ");

    return [
        address.name,
        street,
        address.address2,
        [cityLine, pin].filter(Boolean).join(" - "),
        address.phone ? `Phone: ${address.phone}` : "",
    ].filter(Boolean);
};

const block = (title, lines) => `
    <div class="party">
      <div class="label">${escapeHtml(title)}</div>
      ${lines.map((line, index) => (index === 0 ? `<strong>${escapeHtml(line)}</strong>` : escapeHtml(line))).join("<br>")}
    </div>`;

/**
 * @param {object} order  Order with user, shippingAddress and items (product, variant)
 * @param {{ sellerGstTin?: string|null }} [options]
 */
export function buildInvoiceHtml(order, { sellerGstTin } = {}) {
    const { storeName, storeAddress, storePhone, storeEmail } = getStoreConfig();
    const gstin = sellerGstTin || process.env.STORE_GSTIN || "";

    const shipTo = addressLines(order.shippingAddress);
    const billTo = order.billingAddressSameAsShipping === false && order.billingAddress
        ? addressLines(order.billingAddress)
        : shipTo;

    const items = order.items ?? [];

    const rows = items
        .map((item, index) => {
            const unit = Number(item.price);
            const quantity = Number(item.quantity);
            const amount = Number(item.subtotal ?? unit * quantity);
            return `<tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.product?.name || "Item")}</td>
              <td>${escapeHtml(item.variant?.sku || "")}</td>
              <td class="num">${escapeHtml(quantity)}</td>
              <td class="num">${formatMoney(unit)}</td>
              <td class="num">${formatMoney(amount)}</td>
            </tr>`;
        })
        .join("");

    const totalLine = (label, value, className = "") =>
        `<tr class="${className}"><td>${escapeHtml(label)}</td><td class="num">${formatMoney(value)}</td></tr>`;

    const discount = Number(order.discount) || 0;
    const shipping = Number(order.shippingCost) || 0;
    const codCharge = Number(order.codCharge) || 0;
    const tax = Number(order.tax) || 0;

    const css = `
  .invoice { width: 794px; max-width: 100%; margin: 16px auto; background: #fff; padding: 36px; border: 1px solid #e5e7eb; font-size: 13px; line-height: 1.5; }
  .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111827; padding-bottom: 16px; }
  .top h1 { margin: 0 0 4px; font-size: 22px; }
  .muted { color: #6b7280; }
  .meta { text-align: right; }
  .parties { display: flex; gap: 24px; margin: 20px 0; }
  .party { flex: 1; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  .items th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; border-bottom: 1px solid #d1d5db; padding: 8px 6px; }
  .items td { padding: 8px 6px; border-bottom: 1px solid #eef0f3; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  .totals { width: 320px; margin: 16px 0 0 auto; }
  .totals td { padding: 5px 6px; }
  .totals .grand td { border-top: 2px solid #111827; font-weight: bold; font-size: 15px; padding-top: 8px; }
  .foot { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
  @media print { .invoice { border: 0; margin: 0; width: auto; padding: 0; } }`;

    const body = `
<div class="invoice">
  <div class="top">
    <div>
      <h1>${escapeHtml(storeName)}</h1>
      <div class="muted">${escapeHtml(storeAddress)}<br>${escapeHtml(storePhone)} &middot; ${escapeHtml(storeEmail)}${gstin ? `<br>GSTIN: ${escapeHtml(gstin)}` : ""}</div>
    </div>
    <div class="meta">
      <div style="font-size:20px;font-weight:bold">INVOICE</div>
      <div>No: <strong>${escapeHtml(order.orderNumber)}</strong></div>
      <div>Date: ${escapeHtml(formatDate(order.createdAt))}</div>
      <div>Payment: ${escapeHtml(paymentLabel(order.paymentMethod))}</div>
    </div>
  </div>

  <div class="parties">
    ${block("Bill to", billTo.length ? billTo : [order.user?.name || "Customer"])}
    ${block("Ship to", shipTo.length ? shipTo : [order.user?.name || "Customer"])}
  </div>

  <table class="items">
    <thead><tr><th>#</th><th>Item</th><th>SKU</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="totals">
    ${totalLine("Subtotal", order.subTotal)}
    ${discount > 0 ? totalLine(order.couponCode ? `Discount (${order.couponCode})` : "Discount", -discount) : ""}
    ${totalLine("Shipping", shipping)}
    ${codCharge > 0 ? totalLine("COD charge", codCharge) : ""}
    ${tax > 0 ? totalLine("Tax", tax) : ""}
    ${totalLine("Total (INR)", order.total, "grand")}
  </table>

  <div class="foot">This is a computer generated invoice and does not require a signature.</div>
</div>`;

    return printableDocument({
        title: `Invoice ${order.orderNumber}`,
        css,
        body,
    });
}
