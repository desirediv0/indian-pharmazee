import { toast } from "sonner";

/**
 * Open a document the server built as HTML (shipping label, invoice) in a new
 * tab. The page is shown from a blob: URL, so the admin session token is never
 * put in a URL. Returns the URL so callers can show a link if a pop-up blocker
 * stopped the tab from opening.
 */
export function openHtmlDocument(html: string): string {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const tab = window.open(url, "_blank");
  if (tab) {
    tab.opener = null;
  } else {
    toast.info(
      "Your browser blocked the pop-up. Use the link shown under the buttons."
    );
  }

  // The link stays usable for a few minutes, then the memory is released
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  return url;
}

/** Open a remote document (for example a PDF link from the courier) in a new tab. */
export function openRemoteDocument(url: string): void {
  const tab = window.open(url, "_blank");
  if (tab) {
    tab.opener = null;
  } else {
    toast.info(
      "Your browser blocked the pop-up. Use the link shown under the buttons."
    );
  }
}

export const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return axiosError?.response?.data?.message || axiosError?.message || fallback;
};
