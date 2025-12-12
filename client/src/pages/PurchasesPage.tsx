import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  Button, TextField, Autocomplete, FormControl, InputLabel, 
  Select, MenuItem, Snackbar, Alert, InputAdornment, 
  CircularProgress, Divider, RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import { 
  Add, Delete, ArrowBack, Save, AccountBalanceWallet
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  stockQuantity: number;
  costPrice: number;
}

interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export default function PurchasesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data Lists
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  
  // Payment Logic State
  const [paymentMethod, setPaymentMethod] = useState("Credit");
  const [paymentType, setPaymentType] = useState("Full"); // "Full" or "Partial"
  const [amountPaid, setAmountPaid] = useState<string>("0");

  // Cart State
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  
  // Item Input State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");

  // Alerts
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // --- API BASE URL ---
  const API_BASE = "https://zentra-backend-production-557c.up.railway.app/api";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      // UPDATED LINKS HERE
      const [supRes, prodRes] = await Promise.all([
        axios.get(`${API_BASE}/Suppliers`, { headers }),
        axios.get(`${API_BASE}/Products`, { headers })
      ]);

      setSuppliers(supRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const remainingBalance = grandTotal - Number(amountPaid);

  // --- SMART PAYMENT LOGIC ---
  useEffect(() => {
    if (paymentMethod === "Credit") {
        setAmountPaid("0"); // Credit means pay nothing now
    } else {
        // Cash or Bank
        if (paymentType === "Full") {
            setAmountPaid(grandTotal.toString());
        }
        // If Partial, we leave amountPaid as is (or let user type)
    }
  }, [paymentMethod, paymentType, grandTotal]);


  // --- ADD ITEM TO LIST ---
  const handleAddItem = () => {
    if (!selectedProduct) { setError("Please select a product."); return; }
    if (!qty || Number(qty) <= 0) { setError("Enter valid quantity."); return; }
    if (!cost) { setError("Enter valid cost."); return; }

    const newItem: PurchaseItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: Number(qty),
      unitCost: Number(cost),
      total: Number(qty) * Number(cost)
    };

    setCart([...cart, newItem]);
    setSelectedProduct(null);
    setQty("");
    setCost("");
    setError(""); 
  };

  const handleRemoveItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // --- SUBMIT PURCHASE ---
  const handleSubmit = async () => {
    if (!supplierId || cart.length === 0) {
      setError("Please select supplier and add items.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        supplierId,
        invoiceNumber: invoiceNo || "N/A",
        paymentMethod,
        amountPaid: Number(amountPaid),
        items: cart.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost
        }))
      };

      // UPDATED LINK HERE
      await axios.post(`${API_BASE}/Purchases`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg("Stock Added Successfully!");
      
      // Reset Form
      setCart([]);
      setInvoiceNo("");
      setAmountPaid("0");
      setSupplierId("");
      setPaymentMethod("Credit");
      loadData(); 

    } catch (err) {
      console.error(err);
      setError("Failed to save purchase.");
    }
  };

  // Auto-fill cost
  useEffect(() => {
    if (selectedProduct) setCost((selectedProduct.costPrice || 0).toString());
  }, [selectedProduct]);

  if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: 4 }}>
      <Container maxWidth="lg">
        
        {/* Header */}
        <Box display="flex" alignItems="center" mb={4} gap={2}>
          <IconButton onClick={() => navigate("/dashboard")} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <ArrowBack />
          </IconButton>
          <Box flexGrow={1}>
            <Typography variant="h4" fontWeight="bold" color="#1e293b">Stock In</Typography>
            <Typography variant="body2" color="text.secondary">Record supplier bill & update stock</Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
            
            {/* --- SECTION 1: SUPPLIER INFO (Using CSS Grid Box) --- */}
            <Typography variant="h6" fontWeight="bold" mb={2} color="primary">1. Bill Details</Typography>
            
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                gap: 3, 
                mb: 4 
            }}>
                <FormControl fullWidth size="small">
                    <InputLabel>Select Supplier</InputLabel>
                    <Select value={supplierId} label="Select Supplier" onChange={(e) => setSupplierId(e.target.value)}>
                        {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                    </Select>
                </FormControl>
                
                <TextField 
                    fullWidth label="Supplier Invoice #" size="small"
                    value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)}
                />
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* --- SECTION 2: ADD ITEMS (Using Flex Box) --- */}
            <Typography variant="h6" fontWeight="bold" mb={2} color="primary">2. Add Products</Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
                <Box flexGrow={1} minWidth="250px">
                    <Autocomplete
                        options={products}
                        getOptionLabel={(option) => option.name}
                        value={selectedProduct}
                        onChange={(_, newValue) => setSelectedProduct(newValue)}
                        renderInput={(params) => <TextField {...params} label="Search Product" size="small" />}
                    />
                </Box>
                <TextField 
                    label="Qty" type="number" size="small" sx={{ width: 100 }}
                    value={qty} onChange={(e) => setQty(e.target.value)} 
                />
                <TextField 
                    label="Unit Cost" type="number" size="small" sx={{ width: 120 }}
                    value={cost} onChange={(e) => setCost(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                />
                <Button variant="contained" onClick={handleAddItem} startIcon={<Add />} sx={{ bgcolor: "#3b82f6", minWidth: 100 }}>
                    Add
                </Button>
            </Box>

            {/* --- ITEM LIST --- */}
            <TableContainer sx={{ border: "1px solid #e2e8f0", borderRadius: 1, mb: 4 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>List is empty.</TableCell></TableRow>
                  ) : (
                    cart.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{item.unitCost}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{item.total.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}><Delete fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ mb: 4 }} />

            {/* --- SECTION 3: PAYMENT & COMPLETION (Using CSS Grid Box) --- */}
            <Box bgcolor="#f8fafc" p={3} borderRadius={2} border="1px solid #e2e8f0">
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, 
                    gap: 4 
                }}>
                    
                    {/* Left: Payment Options */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" mb={2} display="flex" alignItems="center">
                            <AccountBalanceWallet sx={{ mr: 1, fontSize: 18 }} /> Payment Details
                        </Typography>
                        
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Payment Method</InputLabel>
                                <Select value={paymentMethod} label="Payment Method" onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <MenuItem value="Credit">Credit (Pay Later)</MenuItem>
                                    <MenuItem value="Cash">Cash</MenuItem>
                                    <MenuItem value="Bank">Bank Transfer</MenuItem>
                                </Select>
                            </FormControl>

                            {paymentMethod !== "Credit" && (
                                <RadioGroup row value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                                    <FormControlLabel value="Full" control={<Radio size="small" />} label="Full" />
                                    <FormControlLabel value="Partial" control={<Radio size="small" />} label="Partial" />
                                </RadioGroup>
                            )}
                        </Box>

                        <Box mt={3}>
                            <TextField 
                                fullWidth label="Amount Paid Now" type="number" size="small"
                                disabled={paymentMethod === "Credit" || paymentType === "Full"}
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                            />
                        </Box>
                    </Box>

                    {/* Right: Grand Totals */}
                    <Box textAlign="right">
                        <Typography variant="body1" color="text.secondary">Total Bill</Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary">Rs. {grandTotal.toLocaleString()}</Typography>
                        
                        <Box mt={2} p={1} bgcolor={remainingBalance > 0 ? "#fee2e2" : "#f0fdf4"} borderRadius={1} border={remainingBalance > 0 ? "1px solid #fecaca" : "1px solid #bbf7d0"}>
                            <Typography variant="body2" color="text.secondary">Remaining Payable (Debt)</Typography>
                            <Typography variant="h6" fontWeight="bold" color={remainingBalance > 0 ? "error" : "success.main"}>
                                Rs. {remainingBalance.toLocaleString()}
                            </Typography>
                        </Box>

                        <Button 
                            variant="contained" size="large" fullWidth
                            startIcon={<Save />}
                            onClick={handleSubmit}
                            disabled={cart.length === 0}
                            sx={{ mt: 3, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, height: 50 }}
                        >
                            Complete Purchase
                        </Button>
                    </Box>

                </Box>
            </Box>

        </Paper>

        <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg("")}>
            <Alert severity="success" sx={{ width: '100%' }}>{msg}</Alert>
        </Snackbar>
        <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError("")}>
            <Alert severity="error">{error}</Alert>
        </Snackbar>

      </Container>
    </Box>
  );
}