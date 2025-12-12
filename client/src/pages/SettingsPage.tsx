import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, Container, Typography, Paper, TextField, Button, 
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow,  Snackbar, Alert, 
  CircularProgress, Chip
} from "@mui/material";
import { 
  Save, History, Store, ArrowBack, Refresh 
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  username: string;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  
  // --- STATE: SHOP PROFILE ---
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [msg, setMsg] = useState("");

  // --- STATE: AUDIT LOGS ---
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load Settings from LocalStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("shopName");
    const savedAddress = localStorage.getItem("shopAddress");
    const savedPhone = localStorage.getItem("shopPhone");

    if (savedName) setShopName(savedName);
    if (savedAddress) setShopAddress(savedAddress);
    if (savedPhone) setShopPhone(savedPhone);

    // Load logs if on logs tab
    if (tabIndex === 1) fetchLogs();
  }, [tabIndex]);

  // --- ACTION: SAVE PROFILE ---
  const handleSaveProfile = () => {
    localStorage.setItem("shopName", shopName);
    localStorage.setItem("shopAddress", shopAddress);
    localStorage.setItem("shopPhone", shopPhone);
    setMsg("Shop Details Saved! Receipts will now use this info.");
  };

  // --- ACTION: FETCH LOGS ---
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5097/api/AuditLogs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
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
            <Typography variant="h4" fontWeight="bold" color="#1e293b">Settings</Typography>
            <Typography variant="body2" color="text.secondary">System configuration and security logs</Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
            <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} indicatorColor="primary" textColor="primary">
                <Tab icon={<Store />} label="Shop Profile" iconPosition="start" />
                <Tab icon={<History />} label="Audit Logs" iconPosition="start" />
            </Tabs>
        </Paper>

        {/* --- TAB 1: SHOP PROFILE --- */}
        {tabIndex === 0 && (
            <Paper sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>Receipt Information</Typography>
                <Box display="flex" flexDirection="column" gap={3}>
                    <TextField 
                        label="Shop Name" fullWidth 
                        placeholder="e.g. Zentra Supermart"
                        value={shopName} onChange={(e) => setShopName(e.target.value)}
                        helperText="This appears at the top of your thermal receipt"
                    />
                    <TextField 
                        label="Address" fullWidth 
                        placeholder="e.g. Main Market, Lahore"
                        value={shopAddress} onChange={(e) => setShopAddress(e.target.value)}
                    />
                    <TextField 
                        label="Phone Number" fullWidth 
                        placeholder="e.g. 0300-1234567"
                        value={shopPhone} onChange={(e) => setShopPhone(e.target.value)}
                    />
                    <Button 
                        variant="contained" size="large" startIcon={<Save />} 
                        onClick={handleSaveProfile}
                        sx={{ bgcolor: "#10b981", mt: 2 }}
                    >
                        Save Settings
                    </Button>
                </Box>
            </Paper>
        )}

        {/* --- TAB 2: AUDIT LOGS --- */}
        {tabIndex === 1 && (
            <Paper sx={{ p: 0, overflow: 'hidden' }}>
                <Box p={2} display="flex" justifyContent="space-between" alignItems="center" bgcolor="#f8fafc" borderBottom="1px solid #e2e8f0">
                    <Typography variant="h6" fontWeight="bold">System Activity</Typography>
                    <IconButton onClick={fetchLogs}><Refresh /></IconButton>
                </Box>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Time</b></TableCell>
                                <TableCell><b>User</b></TableCell>
                                <TableCell><b>Action</b></TableCell>
                                <TableCell><b>Details</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingLogs ? (
                                <TableRow><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow><TableCell colSpan={4} align="center">No activity recorded.</TableCell></TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.85rem' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{log.username}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={log.action} 
                                                size="small" 
                                                color={log.action.includes("Delete") ? "error" : log.action.includes("Update") ? "warning" : "default"} 
                                                variant="outlined" 
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>{log.details}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        )}

        {/* Alerts */}
        <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg("")}>
            <Alert severity="success">{msg}</Alert>
        </Snackbar>

      </Container>
    </Box>
  );
}

// Simple Icon Button wrapper to avoid errors if you haven't imported it in previous files
function IconButton({ onClick, children, sx }: any) {
    return (
        <Button onClick={onClick} sx={{ minWidth: 40, width: 40, height: 40, borderRadius: '50%', p: 0, ...sx }}>
            {children}
        </Button>
    )
}