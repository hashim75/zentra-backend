import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  Button, TextField, InputAdornment, Dialog, DialogTitle, 
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, 
  Chip, CircularProgress
} from "@mui/material";
import { 
  Search, Add, Delete, ArrowBack, CalendarToday, Description 
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export default function ExpensesPage() {
  const navigate = useNavigate();
  
  // Data State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "General",
    date: new Date().toISOString().split('T')[0] // Default to Today
  });

  // --- API URL ---
  const API_URL = "https://zentra-backend-production-557c.up.railway.app/api/Expenses";

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
      setExpenses(res.data);
      setFilteredExpenses(res.data);
    } catch (err) {
      console.error("Failed to load expenses", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const results = expenses.filter(e => 
      e.description.toLowerCase().includes(lowerTerm) || 
      e.category.toLowerCase().includes(lowerTerm)
    );
    setFilteredExpenses(results);
  }, [searchTerm, expenses]);

  // --- SAVE EXPENSE ---
  const handleSave = async () => {
    if (!formData.description || !formData.amount) return;

    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        date: new Date(formData.date).toISOString()
      };

      // UPDATED LINK HERE
      await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOpen(false);
      setFormData({
        description: "", amount: "", category: "General", 
        date: new Date().toISOString().split('T')[0]
      });
      loadData(); // Refresh list

    } catch (err) {
      alert("Failed to save expense.");
    }
  };

  // --- DELETE EXPENSE ---
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense record?")) return;
    try {
      const token = localStorage.getItem("token");
      // UPDATED LINK HERE
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err) {
      alert("Failed to delete.");
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
            <Typography variant="h4" fontWeight="bold" color="#1e293b">Expenses</Typography>
            <Typography variant="body2" color="text.secondary">Track shop costs (Rent, Bills, Salary)</Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => setOpen(true)}
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" }, py: 1.5, px: 3, fontWeight: 'bold' }}
          >
            Record Expense
          </Button>
        </Box>

        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
            <TextField 
                fullWidth 
                placeholder="Search expenses..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                }}
            />
        </Paper>

        {/* Expenses Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell><b>Date</b></TableCell>
                <TableCell><b>Description</b></TableCell>
                <TableCell><b>Category</b></TableCell>
                <TableCell><b>Amount (PKR)</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredExpenses.length === 0 ? (
                 <TableRow><TableCell colSpan={5} align="center">No expenses recorded.</TableCell></TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>
                        <Chip label={expense.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#ef4444' }}>
                        - Rs. {expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => handleDelete(expense.id)}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* --- ADD MODAL --- */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle fontWeight="bold">Record Expense</DialogTitle>
            <DialogContent>
                <Box mt={1} display="flex" flexDirection="column" gap={2}>
                    <TextField 
                        label="Description" fullWidth required 
                        placeholder="e.g. Electricity Bill"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Description /></InputAdornment> }}
                    />
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                        <TextField 
                            label="Amount" type="number" fullWidth required 
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select 
                                label="Category"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <MenuItem value="General">General</MenuItem>
                                <MenuItem value="Rent">Rent</MenuItem>
                                <MenuItem value="Utilities">Utilities (Bills)</MenuItem>
                                <MenuItem value="Salary">Salary</MenuItem>
                                <MenuItem value="Maintenance">Maintenance</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <TextField 
                        label="Date" type="date" fullWidth 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        InputProps={{ startAdornment: <InputAdornment position="start"><CalendarToday /></InputAdornment> }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} color="error">Record Expense</Button>
            </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
}