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
  Search, Add, Delete, ArrowBack,  AttachMoney
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phoneNumber: string;
  balance: number; 
}

export default function SuppliersPage() {
  const navigate = useNavigate();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [open, setOpen] = useState(false); // Add Modal
  const [payOpen, setPayOpen] = useState(false); // Payment Modal
  
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const [formData, setFormData] = useState({ name: "", contactPerson: "", phoneNumber: "" });
  const [msg, setMsg] = useState("");

  // --- API BASE URL ---
  const API_BASE = "https://zentra-backend-production-557c.up.railway.app/api";

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      // UPDATED LINK HERE
      const res = await axios.get(`${API_BASE}/Suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers(res.data);
      setFilteredSuppliers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    setFilteredSuppliers(suppliers.filter(s => s.name.toLowerCase().includes(lowerTerm)));
  }, [searchTerm, suppliers]);

  const handleSave = async () => {
    if (!formData.name) return;
    try {
      const token = localStorage.getItem("token");
      // UPDATED LINK HERE
      await axios.post(`${API_BASE}/Suppliers`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpen(false);
      setFormData({ name: "", contactPerson: "", phoneNumber: "" });
      loadData();
      setMsg("Supplier Added!");
    } catch (err) { alert("Failed."); }
  };

  // --- PAY SUPPLIER LOGIC ---
  const handlePaySupplier = async () => {
    if(!selectedSupplier || !paymentAmount) return;
    try {
        const token = localStorage.getItem("token");
        // UPDATED LINK HERE
        await axios.post(`${API_BASE}/Suppliers/pay`, {
            supplierId: selectedSupplier.id,
            amount: Number(paymentAmount)
        }, { headers: { Authorization: `Bearer ${token}` } });

        setMsg("Payment Recorded! Balance Updated.");
        setPayOpen(false);
        setPaymentAmount("");
        loadData(); // Refresh list to see new balance
    } catch (err) {
        alert("Payment Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    try {
      const token = localStorage.getItem("token");
      // UPDATED LINK HERE
      await axios.delete(`${API_BASE}/Suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err) { alert("Cannot delete active supplier."); }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: 4 }}>
      <Container maxWidth="xl">
        
        <Box display="flex" alignItems="center" mb={4} gap={2}>
          <IconButton onClick={() => navigate("/dashboard")} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <ArrowBack />
          </IconButton>
          <Box flexGrow={1}>
            <Typography variant="h4" fontWeight="bold" color="#1e293b">Suppliers</Typography>
            <Typography variant="body2" color="text.secondary">Manage vendors and payables</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)} sx={{ bgcolor: "#3b82f6" }}>
            Add Supplier
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
            <TextField 
                fullWidth placeholder="Search suppliers..." variant="outlined" size="small"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
        </Paper>

        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell><b>Company Name</b></TableCell>
                <TableCell><b>Contact Person</b></TableCell>
                <TableCell><b>Phone</b></TableCell>
                <TableCell><b>Payable Balance</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow> : 
                filteredSuppliers.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{s.name}</TableCell>
                    <TableCell>{s.contactPerson || "-"}</TableCell>
                    <TableCell>{s.phoneNumber}</TableCell>
                    <TableCell>
                        {s.balance > 0 ? (
                            <Chip label={`You owe: Rs. ${s.balance.toLocaleString()}`} color="error" variant="filled" />
                        ) : (
                            <Chip label="Cleared" color="success" variant="outlined" size="small" />
                        )}
                    </TableCell>
                    <TableCell align="right">
                        {/* PAY BUTTON */}
                        <Tooltip title="Pay Supplier">
                            <IconButton color="primary" onClick={() => { setSelectedSupplier(s); setPayOpen(true); }} disabled={s.balance <= 0}>
                                <AttachMoney />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}>
                                <Delete fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>

        {/* --- ADD MODAL --- */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogContent>
                <Box mt={1} display="flex" flexDirection="column" gap={2}>
                    <TextField label="Company Name" fullWidth value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    <TextField label="Contact Person" fullWidth value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} />
                    <TextField label="Phone" fullWidth value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSave}>Save</Button>
            </DialogActions>
        </Dialog>

        {/* --- PAY MODAL (The New Feature) --- */}
        <Dialog open={payOpen} onClose={() => setPayOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle fontWeight="bold">Pay Supplier</DialogTitle>
            <DialogContent>
                <Box mt={2}>
                    <Typography variant="body2" gutterBottom> Paying to: <b>{selectedSupplier?.name}</b></Typography>
                    <Typography variant="body2" color="error" gutterBottom> Current Debt: Rs. {selectedSupplier?.balance.toLocaleString()}</Typography>
                    <TextField 
                        autoFocus label="Amount Paying" type="number" fullWidth margin="normal"
                        value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setPayOpen(false)}>Cancel</Button>
                <Button variant="contained" color="success" onClick={handlePaySupplier}>Confirm Payment</Button>
            </DialogActions>
        </Dialog>

        <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg("")}>
            <Alert severity="success">{msg}</Alert>
        </Snackbar>

      </Container>
    </Box>
  );
}