import { useState, useEffect } from 'react';
import axios from "axios";
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
  IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Avatar, Menu, MenuItem, useTheme, useMediaQuery, Chip, Snackbar, Alert
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard, Receipt, Inventory, 
  ShoppingCart, People, Assessment, Settings, 
  AccountBalanceWallet, LocalShipping, History, Logout, Person, Badge as BadgeIcon,
  Wifi, WifiOff
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { getOfflineInvoices, clearOfflineInvoices } from "../utils/SyncManager"; // Ensure this file exists

const drawerWidth = 260;

// Helper to decode JWT
function parseJwt (token: string) {
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // User State
  const [username, setUsername] = useState("User");
  const [role, setRole] = useState("Cashier");
  const [shopName, setShopName] = useState("ZentraRetail");

  // Connectivity State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncMsg, setSyncMsg] = useState("");

  // --- 1. INITIAL LOAD & AUTH ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if(token) {
        const decoded = parseJwt(token);
        if(decoded) {
            setUsername(decoded.unique_name || "User");
            const userRole = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
            setRole(userRole || "Cashier");
        }
    }

    const savedShopName = localStorage.getItem("shopName");
    if (savedShopName) {
        setShopName(savedShopName);
    } else if (token) {
        const decoded = parseJwt(token);
        if (decoded && decoded.unique_name) {
            setShopName(decoded.unique_name.toUpperCase()); 
        }
    }
  }, []);

  // --- 2. ONLINE / OFFLINE SYNC LOGIC ---
  useEffect(() => {
    const handleStatusChange = () => {
        setIsOnline(navigator.onLine);
        if (navigator.onLine) {
            triggerSync();
        }
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    // Initial check
    if (navigator.onLine) {
        triggerSync();
    }

    return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const triggerSync = async () => {
    const pending = getOfflineInvoices();
    if (pending.length === 0) return;

    setSyncMsg(`☁️ Syncing ${pending.length} offline invoices...`);
    
    try {
        const token = localStorage.getItem("token");
        for (const invoice of pending) {
            const { tempId, date, ...cleanInvoice } = invoice; 
            // Replace with your actual LIVE API URL if deploying
            await axios.post("http://localhost:5097/api/Invoices", cleanInvoice, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        
        clearOfflineInvoices();
        setSyncMsg("✅ Sync Complete! All offline data uploaded.");
    } catch (err) {
        console.error("Sync failed", err);
        setSyncMsg("⚠️ Sync failed. Will retry later.");
    }
  };

  // --- UI HANDLERS ---
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // --- NAVIGATION MENU CONFIG ---
  const allMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['Admin', 'Cashier'] },
    { text: 'POS (New Sale)', icon: <Receipt />, path: '/pos', roles: ['Admin', 'Cashier'] },
    { text: 'Sales History', icon: <History />, path: '/sales', roles: ['Admin', 'Cashier'] },
    
    { divider: true }, 

    { text: 'Inventory', icon: <Inventory />, path: '/inventory', roles: ['Admin'] }, 
    { text: 'Stock In', icon: <LocalShipping />, path: '/purchases', roles: ['Admin'] }, 
    { text: 'Suppliers', icon: <ShoppingCart />, path: '/suppliers', roles: ['Admin'] }, 
    
    { divider: true },

    { text: 'Customers', icon: <People />, path: '/customers', roles: ['Admin'] }, 
    { text: 'Expenses', icon: <AccountBalanceWallet />, path: '/expenses', roles: ['Admin'] }, 
    
    { divider: true },

    { text: 'Reports', icon: <Assessment />, path: '/reports', roles: ['Admin'] }, 
    { text: 'Settings', icon: <Settings />, path: '/settings', roles: ['Admin'] }, 
    { text: 'Manage Staff', icon: <BadgeIcon />, path: '/staff', roles: ['Admin'] }, 
  ];

  const menuItems = allMenuItems.filter(item => 
    !item.roles || item.roles.includes(role)
  );

  const drawerContent = (
    <Box sx={{ height: '100%', bgcolor: '#1e293b', color: 'white' }}>
      
      {/* SIDEBAR HEADER */}
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, minHeight: 80 }}>
        <Typography 
            variant="h6" 
            fontWeight="bold" 
            sx={{ color: '#10b981', letterSpacing: 0.5, textAlign: 'center', lineHeight: 1.2 }}
        >
          {shopName}
        </Typography>
      </Toolbar>
      
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      <List sx={{ px: 2, pt: 2 }}>
        {menuItems.map((item, index) => (
          item.divider ? (
            <Divider key={index} sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
          ) : (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path!); if(isMobile) setMobileOpen(false); }}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': { bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.7)', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14, fontWeight: 'medium' }} />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* --- TOP BAR --- */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { md: `calc(100% - ${drawerWidth}px)` }, 
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white', color: '#1e293b', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          
          <Box flexGrow={1} /> 

          {/* ONLINE / OFFLINE BADGE */}
          <Box mr={2}>
              {isOnline ? (
                  <Chip 
                    icon={<Wifi style={{color: '#166534'}} />} 
                    label="Online" 
                    size="small" 
                    sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 'bold' }} 
                  />
              ) : (
                  <Chip 
                    icon={<WifiOff style={{color: '#991b1b'}} />} 
                    label="Offline Mode" 
                    size="small" 
                    sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 'bold' }} 
                  />
              )}
          </Box>

          {/* USER PROFILE */}
          <Box display="flex" alignItems="center" gap={1} onClick={handleMenuOpen} sx={{ cursor: 'pointer' }}>
            <Box textAlign="right" sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" fontWeight="bold">{username}</Typography>
              <Box display="flex" justifyContent="flex-end">
                <Chip 
                    label={role} 
                    size="small" 
                    sx={{ height: 20, fontSize: 10, bgcolor: role === 'Admin' ? '#ef4444' : '#10b981', color: 'white' }} 
                />
              </Box>
            </Box>
            <Avatar sx={{ bgcolor: '#e2e8f0', color: '#1e293b' }}><Person /></Avatar>
          </Box>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* --- SIDEBAR --- */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary" open={mobileOpen} onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' } }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* --- MAIN CONTENT --- */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar /> 
        <Outlet /> 
      </Box>

      {/* SYNC NOTIFICATION */}
      <Snackbar open={!!syncMsg} autoHideDuration={4000} onClose={() => setSyncMsg("")}>
        <Alert severity="info" sx={{ width: '100%' }}>
            {syncMsg}
        </Alert>
      </Snackbar>

    </Box>
  );
}