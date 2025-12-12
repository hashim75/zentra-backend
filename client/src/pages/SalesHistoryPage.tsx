import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  Button, TextField, InputAdornment, Chip, CircularProgress, 
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText 
} from "@mui/material";
import { 
  Search, ArrowBack, Receipt, Refresh, Undo
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer?: {
      name: string;
  }; 
  date: string;
  netAmount: number;
  paymentMethod: string;
  status: string; 
  // ADDED THIS: The list of products
  items: InvoiceItem[]; 
}

export default function SalesHistoryPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Return Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5097/api/Invoices", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort by newest first
      const sorted = res.data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setInvoices(sorted);
      setFilteredInvoices(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Search Logic
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const results = invoices.filter(i => 
      (i.customer?.name || "Walking Customer").toLowerCase().includes(lowerTerm) || 
      i.invoiceNumber.toLowerCase().includes(lowerTerm)
    );
    setFilteredInvoices(results);
  }, [searchTerm, invoices]);


  // --- RETURN LOGIC ---
  const handleReturnClick = (id: string) => {
    setSelectedInvoiceId(id);
    setConfirmOpen(true);
  };

  const confirmReturn = async () => {
    if (!selectedInvoiceId) return;
    try {
        const token = localStorage.getItem("token");
        await axios.post(`http://localhost:5097/api/Invoices/${selectedInvoiceId}/return`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setMsg("Invoice Returned Successfully! Stock Restored.");
        setConfirmOpen(false);
        loadData(); 
    } catch (err: any) {
        setConfirmOpen(false);
        setError(err.response?.data?.detail || "Failed to return invoice.");
    }
  };

  // --- PRINT RECEIPT (UPDATED) ---
  const handlePrint = (invoice: Invoice) => {
    const shopName = localStorage.getItem("shopName") || "ZentraRetail";
    const custName = invoice.customer?.name || "Walking Customer";
    
    // 1. Generate Product Rows HTML
    const itemsHtml = invoice.items && invoice.items.length > 0 
      ? invoice.items.map(item => `
          <tr style="border-bottom: 1px dashed #ccc;">
            <td style="text-align: left; padding: 4px 0;">${item.productName}</td>
            <td style="text-align: center; padding: 4px 0;">${item.quantity}</td>
            <td style="text-align: right; padding: 4px 0;">${item.unitPrice}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="3">No items found</td></tr>';

    const win = window.open('', '', 'width=350,height=600');
    if(win) {
        win.document.write(`
            <html>
                <head>
                  <title>Print Receipt</title>
                </head>
                <body style="font-family: 'Courier New', monospace; text-align: center; width: 300px; margin: 0 auto; padding-top: 20px;">
                    
                    <h2 style="margin: 0;">${shopName}</h2>
                    <p style="margin: 5px 0; font-size: 12px;">Duplicate Receipt</p>
                    
                    <div style="text-align: left; font-size: 12px; margin-top: 15px;">
                      <p style="margin: 2px 0;">Inv #: <b>${invoice.invoiceNumber}</b></p>
                      <p style="margin: 2px 0;">Cust: ${custName}</p>
                      <p style="margin: 2px 0;">Date: ${new Date(invoice.date).toLocaleString()}</p>
                    </div>

                    <hr style="border-top: 1px dashed black; margin: 10px 0;"/>

                    <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid black;">
                                <th style="text-align: left;">Item</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <hr style="border-top: 1px dashed black; margin: 10px 0;"/>

                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
                      <span>TOTAL:</span>
                      <span>Rs. ${invoice.netAmount.toLocaleString()}</span>
                    </div>

                    <p style="font-size: 10px; margin-top: 20px;">Status: <b>${invoice.status}</b></p>
                    <p style="font-size: 10px;">Thank you for shopping!</p>
                </body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => {
          win.print();
          // win.close(); // Optional: Close window after print
        }, 500);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: 4 }}>
      <Container maxWidth="xl">
        
        {/* Header */}
        <Box display="flex" alignItems="center" mb={4} gap={2}>
          <IconButton onClick={() => navigate("/dashboard")} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <ArrowBack />
          </IconButton>
          <Box flexGrow={1}>
            <Typography variant="h4" fontWeight="bold" color="#1e293b">Sales History</Typography>
            <Typography variant="body2" color="text.secondary">View and manage past transactions</Typography>
          </Box>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>Refresh</Button>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
            <TextField 
                fullWidth 
                placeholder="Search by Invoice # or Customer Name..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                }}
            />
        </Paper>

        {/* Invoices Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell><b>Inv #</b></TableCell>
                <TableCell><b>Date</b></TableCell>
                <TableCell><b>Customer</b></TableCell>
                <TableCell><b>Payment</b></TableCell>
                <TableCell align="right"><b>Amount</b></TableCell>
                <TableCell align="center"><b>Status</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow> : 
               filteredInvoices.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No sales found.</TableCell></TableRow> :
                filteredInvoices.map((inv) => (
                  <TableRow key={inv.id} hover sx={{ opacity: inv.status === 'Returned' ? 0.6 : 1, bgcolor: inv.status === 'Returned' ? '#fef2f2' : 'inherit' }}>
                    
                    <TableCell sx={{ fontWeight: 'bold' }}>{inv.invoiceNumber}</TableCell>
                    
                    {/* FORMAT DATE */}
                    <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                    
                    {/* CUSTOMER FIX */}
                    <TableCell>{inv.customer?.name || "Walking Customer"}</TableCell>
                    
                    <TableCell>
                        <Chip label={inv.paymentMethod} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Rs. {inv.netAmount.toLocaleString()}</TableCell>
                    
                    <TableCell align="center">
                        {inv.status === "Returned" ? (
                            <Chip label="RETURNED" color="error" size="small" variant="filled" />
                        ) : (
                            <Chip label="Completed" color="success" size="small" variant="outlined" />
                        )}
                    </TableCell>
                    
                    <TableCell align="right">
                        {/* RETURN BUTTON */}
                        {inv.status !== "Returned" && (
                            <Button 
                                size="small" 
                                color="error" 
                                startIcon={<Undo />} 
                                onClick={() => handleReturnClick(inv.id)}
                                sx={{ mr: 1, textTransform: 'none' }}
                            >
                                Return
                            </Button>
                        )}
                        <IconButton size="small" onClick={() => handlePrint(inv)} color="primary">
                            <Receipt fontSize="small" />
                        </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>

        {/* CONFIRM RETURN DIALOG */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle sx={{ fontWeight: 'bold', color: '#dc2626' }}>Confirm Return</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to return this invoice?
                    <br/><br/>
                    <b>1. Stock:</b> Items will be added back to Inventory.<br/>
                    <b>2. Finance:</b> Sales amount will be deducted.<br/>
                    <b>3. Credit:</b> If sold on Udhaar, customer balance will be reduced.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button onClick={confirmReturn} variant="contained" color="error" autoFocus>
                    Confirm Return
                </Button>
            </DialogActions>
        </Dialog>

        {/* ALERTS */}
        <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg("")}>
            <Alert severity="success">{msg}</Alert>
        </Snackbar>
        <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError("")}>
            <Alert severity="error">{error}</Alert>
        </Snackbar>

      </Container>
    </Box>
  );
}