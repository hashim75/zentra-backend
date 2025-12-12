import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, Button, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Select, MenuItem, FormControl, InputLabel, Checkbox, 
  FormControlLabel, Snackbar, Alert, InputAdornment, Tooltip
} from "@mui/material";
import { Add, Delete, Edit, Search, QrCode, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  salePrice: number;
  stockQuantity: number;
  lowStockAlert: number; // Added this to interface
  categoryName: string;
  categoryId: string; // Needed for filtering
  // Note: CostPrice is hidden for security in list, so it might show as 0 in edit unless we fetch detail
}

export default function InventoryPage() {
  const navigate = useNavigate();

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [_, setLoading] = useState(true);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modal State (Add/Edit Product)
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // <--- Track Edit Mode

  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    sku: "",
    salePrice: "",
    costPrice: "",
    stockQuantity: "",
    lowStockAlert: "5",
    categoryId: "",
    isExpireable: false,
    expiryDate: ""
  });

  // Modal State (Quick Add Category)
  const [openCatDialog, setOpenCatDialog] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Alerts
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [prodRes, catRes] = await Promise.all([
        axios.get("http://localhost:5097/api/Products", { headers }),
        axios.get("http://localhost:5097/api/Categories", { headers })
      ]);

      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  // --- OPEN EDIT MODAL ---
  const handleEdit = (product: Product) => {
    setEditingId(product.id); // Set ID so we know we are updating
    setFormData({
        name: product.name,
        barcode: product.barcode,
        sku: product.sku,
        salePrice: product.salePrice.toString(),
        costPrice: "", // Note: API List doesn't send cost price for security. User must re-enter or we need a Detail API.
        stockQuantity: product.stockQuantity.toString(),
        lowStockAlert: product.lowStockAlert.toString(),
        categoryId: product.categoryId || "", // Handle if null
        isExpireable: false, // Defaulting as these aren't in list DTO yet
        expiryDate: ""
    });
    setOpen(true);
  };

  // --- SAVE PRODUCT (CREATE OR UPDATE) ---
  const handleSaveProduct = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload = {
        ...formData,
        id: editingId, // Important for Update
        salePrice: Number(formData.salePrice),
        costPrice: Number(formData.costPrice),
        stockQuantity: Number(formData.stockQuantity),
        lowStockAlert: Number(formData.lowStockAlert),
        expiryDate: formData.isExpireable && formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null
      };

      if (editingId) {
        // --- UPDATE LOGIC (PUT) ---
        await axios.put(`http://localhost:5097/api/Products/${editingId}`, payload, { headers });
        setMsg("Product Updated Successfully!");
      } else {
        // --- CREATE LOGIC (POST) ---
        await axios.post("http://localhost:5097/api/Products", payload, { headers });
        setMsg("Product Added Successfully!");
      }

      handleCloseDialog();
      loadData(); 

    } catch (err) {
      console.error(err);
      alert("Failed to save product. Check inputs.");
    }
  };

  // --- QUICK SAVE CATEGORY ---
  const handleSaveCategory = async () => {
    if (!newCatName) return;
    try {
        const token = localStorage.getItem("token");
        const res = await axios.post("http://localhost:5097/api/Categories", {
            name: newCatName,
            description: "Quick Added"
        }, { headers: { Authorization: `Bearer ${token}` } });

        const newCat = { id: res.data, name: newCatName };
        setCategories([...categories, newCat]);
        setFormData({ ...formData, categoryId: newCat.id });

        setMsg("Category Created!");
        setOpenCatDialog(false);
        setNewCatName("");
    } catch (err) {
        alert("Failed to add category.");
    }
  };

  // --- DELETE PRODUCT ---
  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this product?")) return;
    try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5097/api/Products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setMsg("Product Deleted!");
        loadData();
    } catch (err) {
        alert("Cannot delete product (It might be used in sales).");
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingId(null); // Reset Edit Mode
    setFormData({
        name: "", barcode: "", sku: "", salePrice: "", costPrice: "",
        stockQuantity: "", lowStockAlert: "5", categoryId: "",
        isExpireable: false, expiryDate: ""
      });
  }

  // --- SMART FILTER LOGIC ---
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm);
    // Safe check for categoryId if it's undefined
    const matchesCategory = categoryFilter === "All" || p.categoryId === categoryFilter; 
    return matchesSearch && matchesCategory;
  });

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: 4 }}>
      <Container maxWidth="xl">
        
        {/* Header */}
        <Box display="flex" alignItems="center" mb={4} gap={2}>
          <IconButton onClick={() => navigate("/dashboard")} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" color="#1e293b" sx={{ flexGrow: 1 }}>
            Inventory Management
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => setOpen(true)}
            sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, py: 1.5, px: 3, fontWeight: 'bold' }}
          >
            Add New Product
          </Button>
        </Box>

        {/* Filters Bar */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ flexGrow: 1, minWidth: '250px' }}>
                <TextField 
                    fullWidth 
                    placeholder="Search by Name or Barcode..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                    }}
                />
            </Box>
            
            <Box sx={{ minWidth: '200px' }}>
                <FormControl fullWidth size="small">
                    <InputLabel>Filter by Category</InputLabel>
                    <Select
                        value={categoryFilter}
                        label="Filter by Category"
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <MenuItem value="All">All Categories</MenuItem>
                        {categories.map((c) => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        </Paper>

        {/* Product Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell><b>Product Name</b></TableCell>
                <TableCell><b>Category</b></TableCell>
                <TableCell><b>Barcode</b></TableCell>
                <TableCell><b>Stock</b></TableCell>
                <TableCell><b>Price (PKR)</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                          <Typography color="text.secondary">No products found.</Typography>
                      </TableCell>
                  </TableRow>
              ) : (
                filteredProducts.map((p) => (
                    <TableRow key={p.id} hover>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                        <span style={{
                            background: '#e0f2f1', 
                            color: '#065f46',
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}>
                            {p.categoryName}
                        </span>
                    </TableCell>
                    <TableCell>{p.barcode}</TableCell>
                    <TableCell style={{color: p.stockQuantity <= 5 ? '#ef4444' : '#10b981', fontWeight: 'bold'}}>
                        {p.stockQuantity}
                    </TableCell>
                    <TableCell>Rs. {p.salePrice.toLocaleString()}</TableCell>
                    <TableCell align="right">
                        {/* --- EDITED: ADDED ONCLICK HANDLER --- */}
                        <IconButton size="small" color="primary" onClick={() => handleEdit(p)}>
                            <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* --- DIALOG 1: ADD/EDIT PRODUCT --- */}
        <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle fontWeight="bold">{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogContent>
            <Box mt={1} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                
                <TextField fullWidth label="Product Name" required 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />

                <Box display="flex" gap={1}>
                    <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select 
                            label="Category" 
                            value={formData.categoryId}
                            onChange={(e) => setFormData({...formData, categoryId: e.target.value})} 
                        >
                            {categories.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {!editingId && ( // Only show Quick Add Category in Create mode to be safe
                        <Tooltip title="Create New Category">
                            <Button variant="contained" sx={{ bgcolor: "#10b981", minWidth: '50px' }} onClick={() => setOpenCatDialog(true)}>
                                <Add />
                            </Button>
                        </Tooltip>
                    )}
                </Box>

                <TextField fullWidth label="Barcode" 
                    InputProps={{ startAdornment: <InputAdornment position="start"><QrCode /></InputAdornment> }}
                    value={formData.barcode} 
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})} 
                />
                <TextField fullWidth label="SKU (Optional)" 
                    value={formData.sku} 
                    onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                />

                <Box sx={{ gridColumn: { md: 'span 2' }, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <TextField fullWidth label="Cost Price" type="number" 
                        value={formData.costPrice} 
                        helperText={editingId ? "Re-enter cost price to update" : ""}
                        onChange={(e) => setFormData({...formData, costPrice: e.target.value})} 
                    />
                    <TextField fullWidth label="Sale Price" type="number" required
                        value={formData.salePrice} 
                        onChange={(e) => setFormData({...formData, salePrice: e.target.value})} 
                    />
                    <TextField fullWidth label="Stock Quantity" type="number" required
                        value={formData.stockQuantity} 
                        onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} 
                    />
                </Box>

                <TextField fullWidth label="Low Stock Alert Level" type="number" 
                    value={formData.lowStockAlert} 
                    onChange={(e) => setFormData({...formData, lowStockAlert: e.target.value})} 
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel control={
                        <Checkbox 
                            checked={formData.isExpireable} 
                            onChange={(e) => setFormData({...formData, isExpireable: e.target.checked})} 
                        />
                    } label="Has Expiry Date?" />
                    
                    {formData.isExpireable && (
                        <TextField fullWidth type="date" size="small"
                            value={formData.expiryDate} 
                            onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} 
                        />
                    )}
                </Box>

            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveProduct} sx={{ bgcolor: "#10b981" }}>
                {editingId ? "Update Product" : "Save Product"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* --- DIALOG 2: QUICK ADD CATEGORY --- */}
        <Dialog open={openCatDialog} onClose={() => setOpenCatDialog(false)}>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogContent>
                <TextField 
                    autoFocus margin="dense" label="Category Name" fullWidth variant="outlined" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenCatDialog(false)}>Cancel</Button>
                <Button onClick={handleSaveCategory} variant="contained" sx={{ bgcolor: "#10b981" }}>Add</Button>
            </DialogActions>
        </Dialog>

        {/* Success Alert */}
        <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg("")}>
            <Alert severity="success">{msg}</Alert>
        </Snackbar>

      </Container>
    </Box>
  );
}