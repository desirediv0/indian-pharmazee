/**
 * Helpers for the printable documents (shipping label, invoice) the admin
 * panel opens in a new tab.
 */

export function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function formatMoney(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "0.00";
    return number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Wrap a document body in a full HTML page.
 *
 * The admin panel shows this page from a blob: URL, which shares the admin
 * panel's origin. The Content-Security-Policy therefore forbids all scripts
 * and network access, so even a missed escape could not run code or reach the
 * admin session. (Print with Ctrl/Cmd + P.)
 */
export function printableDocument({ title, css, body }) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #f3f4f6; }
  .print-hint { padding: 10px 16px; background: #111827; color: #fff; font-size: 13px; text-align: center; }
  @media print { .print-hint { display: none; } body { background: #fff; } }
${css}
</style>
</head>
<body>
<div class="print-hint">Press Ctrl + P (Cmd + P on Mac) to print or save as PDF</div>
${body}
</body>
</html>`;
}
