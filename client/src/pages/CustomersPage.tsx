import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  Button, TextField, InputAdornment, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip, CircularProgress, Tooltip,
  Snackbar, Alert
} from "@mui/material";
import { 
  Search, Add, Delete, ArrowBack, Phone, Person, Edit, AttachMoney 
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  creditBalance: number; // Positive = They owe us money
}

export default function CustomersPage() {
  const navigate = useNavigate();
  
  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add/Edit Modal
  const [open, setOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  
  // Selection
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: ""
  });

  // Notifications
  const [msg, setMsg] = useState("");

  // --- API URL ---
  const API_URL = "https://zentra-backend-production-557c.up.railway.app/api/Customers";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      // UPDATED LINK HERE
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data);
      setFilteredCustomers(res.data);
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const results = customers.filter(c => 
      c.name.toLowerCase().includes(lowerTerm) || 
      c.phoneNumber.includes(lowerTerm)
    );
    setFilteredCustomers(results);
  }, [searchTerm, customers]);

  // --- SAVE CUSTOMER ---
  const handleSave = async () => {
    if (!formData.name) return;
    try {
      const token = localStorage.getItem("token");
      
      // Basic Update/Create Logic
      if(selectedCustomer) {
         // UPDATED LINK HERE
         await axios.put(`${API_URL}/${selectedCustomer.id}`, {
             ...selectedCustomer, ...formData
         }, { headers: { Authorization: `Bearer ${token}` } });
         setMsg("Customer Updated!");
      } else {
         // UPDATED LINK HERE
         await axios.post(API_URL, formData, {
            headers: { Authorization: `Bearer ${token}` }
         });
         setMsg("Customer Created!");
      }

      setOpen(false);
      setFormData({ name: "", phoneNumber: "" });
      setSelectedCustomer(null);
      loadData();
    } catch (err) {
      alert("Failed to save customer.");
    }
  };

  // --- RECEIVE PAYMENT (Udhaar Wapsi) ---
  const handleReceivePayment = async () => {
    if(!selectedCustomer || !paymentAmount) return;
    
    // Calculate new balance
    const newBalance = selectedCustomer.creditBalance - Number(paymentAmount);
    
    try {
        const token = localStorage.getItem("token");
        // UPDATED LINK HERE
        await axios.put(`${API_URL}/${selectedCustomer.id}`, {
            ...selectedCustomer,
            creditBalance: newBalance
        }, { headers: { Authorization: `Bearer ${token}` } });

        setMsg(`Payment of Rs. ${paymentAmount} Received!`);
        setPaymentOpen(false);
        setPaymentAmount("");
        setSelectedCustomer(null);
        loadData();
    } catch(err) {
        alert("Payment Failed");
    }
  };

  // --- DELETE CUSTOMER ---
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      // UPDATED LINK HERE
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("Customer Deleted");
      loadData();
    } catch (err) {
      alert("Cannot delete customer (Sales history exists).");
    }
  };

  const openEdit = (c: Customer) => {
      setSelectedCustomer(c);
      setFormData({ name: c.name, phoneNumber: c.phoneNumber });
      setOpen(true);
  }

  const openPayment = (c: Customer) => {
      setSelectedCustomer(c);
      setPaymentOpen(true);
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: 4 }}>
      <Container maxWidth="xl">
        
        {/* Header */}
        <Box display="flex" alignItems="center" mb={4} gap={2}>
          <IconButton onClick={() => navigate("/dashboard")} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <ArrowBack />
          </IconButton>
          <Box flexGrow={1}>
            <Typography variant="h4" fontWeight="bold" color="#1e293b">Customer Ledger</Typography>
            <Typography variant="body2" color="text.secondary">Manage Udhaar (Credit) and Recoveries</Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => { setSelectedCustomer(null); setFormData({name:"", phoneNumber:""}); setOpen(true); }}
            sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" }, py: 1.5, px: 3, fontWeight: 'bold' }}
          >
            Add Customer
          </Button>
        </Box>

        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
            <TextField 
                fullWidth 
                placeholder="Search customers by name or phone..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                }}
            />
        </Paper>

        {/* Customers Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell><b>Name</b></TableCell>
                <TableCell><b>Phone</b></TableCell>
                <TableCell><b>Debt (Udhaar)</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredCustomers.length === 0 ? (
                 <TableRow><TableCell colSpan={4} align="center">No customers found.</TableCell></TableRow>
              ) : (
                filteredCustomers.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{c.name}</TableCell>
                    <TableCell>{c.phoneNumber || "-"}</TableCell>
                    <TableCell>
                        {c.creditBalance > 0 ? (
                            <Chip label={`Rs. ${c.creditBalance.toLocaleString()}`} color="error" sx={{ fontWeight: 'bold' }} />
                        ) : (
                            <Chip label="Clear" color="success" size="small" variant="outlined" />
                        )}
                    </TableCell>
                    <TableCell align="right">
                        <Tooltip title="Receive Payment">
                            <IconButton color="success" onClick={() => openPayment(c)} disabled={c.creditBalance <= 0}>
                                <AttachMoney />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => openEdit(c)}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                                <Delete />
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* --- ADD/EDIT MODAL --- */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle fontWeight="bold">{selectedCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogContent>
                <Box mt={1} display="flex" flexDirection="column" gap={2}>
                    <TextField 
                        label="Customer Name" fullWidth required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }}
                    />
                    <TextField 
                        label="Phone Number" fullWidth 
                        placeholder="0300-1234567"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSave}>Save</Button>
            </DialogActions>
        </Dialog>

        {/* --- PAYMENT MODAL --- */}
        <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle fontWeight="bold">Receive Payment</DialogTitle>
            <DialogContent>
                <Box mt={2}>
                    <Typography variant="body2" gutterBottom>
                        Receiving from: <b>{selectedCustomer?.name}</b>
                    </Typography>
                    <Typography variant="body2" gutterBottom color="error">
                        Current Debt: Rs. {selectedCustomer?.creditBalance.toLocaleString()}
                    </Typography>
                    
                    <TextField 
                        autoFocus
                        label="Amount Received" type="number" fullWidth margin="normal"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setPaymentOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleReceivePayment} color="success">Confirm Payment</Button>
            </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg("")}>
            <Alert severity="success" sx={{ width: '100%' }}>{msg}</Alert>
        </Snackbar>

      </Container>
    </Box>
  );
}