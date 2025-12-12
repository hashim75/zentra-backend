// Save a failed invoice to local storage
export const saveOfflineInvoice = (invoice: any) => {
    const pending = JSON.parse(localStorage.getItem("offline_invoices") || "[]");
    pending.push(invoice);
    localStorage.setItem("offline_invoices", JSON.stringify(pending));
};

// Get all offline invoices
export const getOfflineInvoices = () => {
    return JSON.parse(localStorage.getItem("offline_invoices") || "[]");
};

// Clear them after successful sync
export const clearOfflineInvoices = () => {
    localStorage.removeItem("offline_invoices");
};