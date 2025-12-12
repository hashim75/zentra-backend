import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  Button, TextField, InputAdornment, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip, CircularProgress, Tooltip,
  Snackbar, Alert, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { 
   Add, Delete, ArrowBack, Person, Badge, VpnKey, Security 
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface User {
  id: string;
  username: string;
  role: string; // "Admin" or "Cashier"
}

export default function StaffPage() {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);


  // Modals
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", role: "Cashier" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  // 1. LOAD USERS LIST
  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      // This fetches the list of all users to display in the table
      const res = await axios.get("http://localhost:5097/api/Users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. CREATE STAFF (Updated Endpoint)
  const handleCreateUser = async () => {
    if (!formData.username || !formData.password) {
        setError("Username and Password are required.");
        return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      // POST to the correct Auth endpoint
      await axios.post("http://localhost:5097/api/Auth/create-staff", {
          username: formData.username,
          password: formData.password,
          role: formData.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg("Staff Account Created Successfully!");
      setOpen(false);
      setFormData({ username: "", password: "", role: "Cashier" });
      loadData(); // Refresh the list immediately
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create user. Username might already exist.");
    }
  };

  // 3. DELETE STAFF
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this staff account? They will no longer be able to login.")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5097/api/Users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg("User Deleted");
      loadData();
    } catch (err) { setError("Cannot delete user."); }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: 4 }}>
      <Container maxWidth="lg">
        
        {/* Header */}
        <Box display="flex" alignItems="center" mb={4} gap={2}>
          <IconButton onClick={() => navigate("/dashboard")} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <ArrowBack />
          </IconButton>
          <Box flexGrow={1}>
            <Typography variant="h4" fontWeight="bold" color="#1e293b">Staff Management</Typography>
            <Typography variant="body2" color="text.secondary">Create accounts and manage access roles</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)} sx={{ bgcolor: "#3b82f6" }}>
            Add Staff
          </Button>
        </Box>

        {/* Staff Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell><b>Username</b></TableCell>
                <TableCell><b>Role</b></TableCell>
                <TableCell><b>Access Level</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow> : 
                users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Person sx={{ color: 'text.secondary', fontSize: 20 }} /> {u.username}
                        </Box>
                    </TableCell>
                    <TableCell>
                        <Chip 
                            label={u.role} 
                            color={u.role === 'Admin' ? "error" : "success"} 
                            size="small" 
                            variant="filled"
                            icon={u.role === 'Admin' ? <Security fontSize="small" /> : <Badge fontSize="small" />}
                        />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {u.role === 'Admin' ? "Full Control" : "POS & Sales Only"}
                    </TableCell>
                    <TableCell align="right">
                        <Tooltip title="Delete Account">
                            <IconButton size="small" color="error" onClick={() => handleDelete(u.id)} disabled={u.role === 'Admin'}>
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

        {/* --- ADD USER MODAL --- */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle fontWeight="bold">Add New Staff</DialogTitle>
            <DialogContent>
                <Box mt={1} display="flex" flexDirection="column" gap={3}>
                    <TextField 
                        label="Username" fullWidth required 
                        placeholder="e.g. cashier1"
                        value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }}
                    />
                    <TextField 
                        label="Password" type="password" fullWidth required 
                        value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                        InputProps={{ startAdornment: <InputAdornment position="start"><VpnKey /></InputAdornment> }}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={formData.role}
                            label="Role"
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                        >
                            <MenuItem value="Cashier">Cashier (Restricted)</MenuItem>
                            <MenuItem value="Admin">Admin (Full Access)</MenuItem>
                        </Select>
                    </FormControl>
                    <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                        <b>Cashier:</b> Can only access POS and Sales History.<br/>
                        <b>Admin:</b> Can access Settings, Reports, Inventory, etc.
                    </Alert>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleCreateUser}>Create Account</Button>
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