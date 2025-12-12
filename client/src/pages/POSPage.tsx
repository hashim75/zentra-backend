import { useEffect, useState, useRef } from "react";
import { saveOfflineInvoice } from "../utils/SyncManager"; // Import the helper
import axios from "axios";
import { 
  Box, Paper, Typography, Button, TextField, IconButton, 
  Card, CardActionArea, Avatar, Divider, CircularProgress, 
  Snackbar, Alert, Autocomplete 
} from "@mui/material";
import { 
  Add, Remove, Delete, ShoppingCart, Search, Receipt, CropFree 
} from "@mui/icons-material";


// --- Types ---
interface Product {
  id: string;
  name: string;
  barcode: string;
  salePrice: number;
  stockQuantity: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
}

export default function POSPage() {
 
  const [loading, setLoading] = useState(true);
  
  // Data Lists
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Cart & Transaction State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  
  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  
  // Scanner Ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Alerts
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [prodRes, custRes] = await Promise.all([
        axios.get("http://localhost:5097/api/Products", { headers }),
        axios.get("http://localhost:5097/api/Customers", { headers })
      ]);

      setProducts(prodRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- 1. BARCODE SCANNER LOGIC ---
  const handleScan = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault(); 
        
        const exactMatch = products.find(p => 
            p.barcode === searchTerm || 
            p.name.toLowerCase() === searchTerm.toLowerCase()
        );

        if (exactMatch) {
            addToCart(exactMatch);
            setSearchTerm(""); 
        } else {
            setError("Product not found!");
        }
    }
  };

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
        setError(`Out of Stock! (${product.name})`);
        return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
        if (existingItem.quantity + 1 > product.stockQuantity) {
             setError("Not enough stock!");
             return;
        }
        setCart(cart.map(item => 
            item.productId === product.id 
                ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
                : item
        ));
    } else {
        setCart([...cart, {
            productId: product.id,
            name: product.name,
            price: product.salePrice,
            quantity: 1,
            total: product.salePrice
        }]);
    }
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQty > product.stockQuantity) {
        setError(`Only ${product.stockQuantity} left in stock.`);
        return;
    }

    setCart(cart.map(item => 
        item.productId === productId 
            ? { ...item, quantity: newQty, total: newQty * item.price }
            : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // --- CHECKOUT LOGIC ---
 const handleCheckout = async () => {
    if (cart.length === 0) { setError("Cart is empty!"); return; }
    
    // Construct Payload
    const payload = {
        customerId: selectedCustomer?.id || null,
        paymentMethod,
        discountAmount: Number(discount) || 0,
        paidAmount: Number(paidAmount) || 0,
        // Mark as offline if no internet (Backend can use this flag)
        isSyncedToCloud: navigator.onLine, 
        items: cart.map(i => ({
            productId: i.productId,
            quantity: i.quantity
        }))
    };

    // --- OFFLINE CHECK ---
    if (!navigator.onLine) {
        // 1. Save to Local Storage
        saveOfflineInvoice({ ...payload, tempId: Date.now(), date: new Date().toISOString() });
        
        // 2. Clear Cart & Notify User
        setMsg("Internet Down! Sale Saved LOCALLY. Will sync when online. ☁️");
        setCart([]);
        setDiscount("");
        setPaidAmount("");
        setSearchTerm("");
        return; 
    }

    // --- ONLINE CHECKOUT ---
    try {
        const token = localStorage.getItem("token");
        await axios.post("http://your-live-api-url.com/api/Invoices", payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        setMsg("Sale Completed Successfully!");
        setCart([]);
        setDiscount("");
        setPaidAmount("");
        setSearchTerm("");
        loadData(); 

    } catch (err: any) {
        // If server error, ALSO save offline just in case
        console.error("Checkout Failed", err);
        setError("Checkout Failed. Please try again.");
    }
};

  // Calculations
  const subTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const netTotal = subTotal - (Number(discount) || 0);
  const change = (Number(paidAmount) || 0) - netTotal;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm)
  );

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: { xs: "column", md: "row" }, bgcolor: "#f1f5f9" }}>
      
        {/* --- LEFT: PRODUCT CATALOG (Flex 1) --- */}
        <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
            
            {/* Search Bar */}
            <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <CropFree sx={{ color: 'text.secondary' }} />
                <TextField 
                    inputRef={searchInputRef}
                    fullWidth 
                    placeholder="Scan Barcode or Search Product..." 
                    variant="standard"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleScan} 
                    autoFocus
                />
                <IconButton onClick={() => setSearchTerm("")}><Search /></IconButton>
            </Paper>

            {/* Product Grid (Using CSS Grid inside Box) */}
            <Box sx={{ flexGrow: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2, alignContent: "start" }}>
                {filteredProducts.slice(0, 50).map(product => (
                    <Card 
                        key={product.id}
                        sx={{ display: 'flex', flexDirection: 'column', border: product.stockQuantity <= 0 ? '1px solid #ef4444' : 'none', height: 180 }}
                        onClick={() => addToCart(product)}
                    >
                        <CardActionArea sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Avatar sx={{ bgcolor: product.stockQuantity > 0 ? '#e0f2f1' : '#fee2e2', color: product.stockQuantity > 0 ? '#10b981' : '#ef4444', width: 50, height: 50, mb: 1 }}>
                                {product.name.substring(0,2).toUpperCase()}
                            </Avatar>
                            <Typography variant="subtitle2" fontWeight="bold" align="center" noWrap sx={{ width: '100%' }}>{product.name}</Typography>
                            <Typography variant="body2" color="text.secondary" align="center">Stock: {product.stockQuantity}</Typography>
                            <Typography variant="h6" color="primary" align="center" fontWeight="bold" mt={0.5}>Rs. {product.salePrice}</Typography>
                        </CardActionArea>
                    </Card>
                ))}
                {filteredProducts.length === 0 && (
                    <Box sx={{ gridColumn: "1 / -1", textAlign: "center", mt: 5, color: "text.secondary" }}>
                        <Typography>No products found.</Typography>
                    </Box>
                )}
            </Box>
        </Box>

        {/* --- RIGHT: CART & CHECKOUT (Fixed Width on Desktop) --- */}
        <Box sx={{ width: { xs: "100%", md: "400px", lg: "450px" }, bgcolor: "white", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "100%" }}>
            
            {/* Customer Select */}
            <Box p={2} bgcolor="#f8fafc" borderBottom="1px solid #e2e8f0">
                <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => option.name}
                    value={selectedCustomer}
                    onChange={(_, newValue) => setSelectedCustomer(newValue)}
                    renderInput={(params) => <TextField {...params} label="Select Customer (Optional)" size="small" fullWidth />}
                />
            </Box>

            {/* Cart Items */}
            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
                {cart.length === 0 ? (
                    <Box textAlign="center" mt={10} color="text.secondary">
                        <ShoppingCart sx={{ fontSize: 60, opacity: 0.2 }} />
                        <Typography>Cart is empty</Typography>
                    </Box>
                ) : (
                    cart.map(item => (
                        <Box key={item.productId} display="flex" justifyContent="space-between" alignItems="center" mb={2} p={1} borderBottom="1px dashed #e2e8f0">
                            <Box flexGrow={1}>
                                <Typography variant="subtitle2" fontWeight="bold">{item.name}</Typography>
                                <Typography variant="caption" color="text.secondary">Rs. {item.price} x {item.quantity}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                                <IconButton size="small" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Remove fontSize="small" /></IconButton>
                                <Typography fontWeight="bold">{item.quantity}</Typography>
                                <IconButton size="small" onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Add fontSize="small" /></IconButton>
                            </Box>
                            <Box textAlign="right" minWidth={60}>
                                <Typography fontWeight="bold">Rs. {item.total}</Typography>
                                <IconButton size="small" color="error" onClick={() => removeFromCart(item.productId)}><Delete fontSize="small" /></IconButton>
                            </Box>
                        </Box>
                    ))
                )}
            </Box>

            {/* Payment & Totals */}
            <Box p={3} borderTop="1px solid #e2e8f0" bgcolor="#f8fafc">
                <Box display="flex" gap={2} mb={2}>
                    <TextField 
                        label="Discount" size="small" fullWidth type="number" 
                        value={discount} onChange={(e) => setDiscount(e.target.value)}
                    />
                    <TextField 
                        label="Amount Paid" size="small" fullWidth type="number" 
                        value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
                    />
                </Box>

                <Box display="flex" gap={1} mb={2}>
                    <Button 
                        variant={paymentMethod === "Cash" ? "contained" : "outlined"} 
                        onClick={() => setPaymentMethod("Cash")} fullWidth
                        color="success"
                    >
                        Cash
                    </Button>
                    <Button 
                        variant={paymentMethod === "Credit" ? "contained" : "outlined"} 
                        onClick={() => setPaymentMethod("Credit")} fullWidth
                        color="warning"
                    >
                        Credit
                    </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Subtotal</Typography>
                    <Typography fontWeight="bold">Rs. {subTotal.toLocaleString()}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography color="error">Discount</Typography>
                    <Typography color="error">- Rs. {(Number(discount) || 0).toLocaleString()}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="h5" fontWeight="bold">Total</Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">Rs. {netTotal.toLocaleString()}</Typography>
                </Box>
                
                {paymentMethod === "Cash" && (
                    <Box display="flex" justifyContent="space-between" mb={2} p={1} bgcolor="#ecfdf5" borderRadius={1}>
                        <Typography color="success.main" fontWeight="bold">Change Back</Typography>
                        <Typography color="success.main" fontWeight="bold">Rs. {change > 0 ? change.toLocaleString() : 0}</Typography>
                    </Box>
                )}

                <Button 
                    variant="contained" 
                    fullWidth 
                    size="large" 
                    startIcon={<Receipt />}
                    onClick={handleCheckout}
                    sx={{ height: 50, fontSize: 18 }}
                >
                    Checkout (F12)
                </Button>
            </Box>
        </Box>
      

      {/* ALERTS */}
      <Snackbar open={!!msg} autoHideDuration={2000} onClose={() => setMsg("")}>
        <Alert severity="success">{msg}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={2000} onClose={() => setError("")}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>

    </Box>
  );
}