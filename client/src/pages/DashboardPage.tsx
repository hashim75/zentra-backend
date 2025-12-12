import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, Paper, Typography, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Avatar
} from "@mui/material";
import { 
  AttachMoney, TrendingUp, Warning, Star, 
  ShowChart, Refresh, PieChart as PieIcon, ShoppingBag
} from "@mui/icons-material";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

// --- Types ---
interface RecentSale { id: string; time: string; customer: string; amount: number; status: string; }
interface LowStockItem { name: string; stock: number; }
interface PaymentStat { name: string; value: number; [key: string]: any; }
interface TopProduct { name: string; quantity: number; revenue: number; }
interface SalesTrend { dateLabel: string; total: number; profit: number; }

interface DashboardStats {
  totalSalesToday: number;
  totalProfitToday: number;
  lowStockItemCount: number;
  topSellingProduct: string;
  salesTrend: SalesTrend[];
  recentSales: RecentSale[];
  lowStockItems: LowStockItem[];
  paymentStats: PaymentStat[];
  topProducts: TopProduct[];
}

// Chart Colors
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // --- API URL ---
  const API_URL = "https://zentra-backend-production-557c.up.railway.app/api/Dashboard";

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // UPDATED LINK HERE
      const response = await axios.get(`${API_URL}?_=${new Date().getTime()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const formatTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "-" : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <Box sx={{ height: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 5 }}>
      
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="800" color="#1e293b">Dashboard Overview</Typography>
            <Typography variant="body2" color="text.secondary">Welcome back! Here is what's happening today.</Typography>
          </Box>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchStats} sx={{textTransform: 'none'}}>
            Refresh Data
          </Button>
      </Box>

      {/* 1. KPI CARDS (Grid Layout using Box) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" }, gap: 3 }}>
          <StatCard title="Total Sales (Today)" value={`Rs. ${stats?.totalSalesToday.toLocaleString()}`} icon={<AttachMoney />} color="#10b981" bg="#d1fae5" />
          <StatCard title="Net Profit (Today)" value={`Rs. ${stats?.totalProfitToday.toLocaleString()}`} icon={<TrendingUp />} color="#3b82f6" bg="#dbeafe" />
          <StatCard title="Low Stock Alerts" value={stats?.lowStockItemCount.toString() || "0"} icon={<Warning />} color="#f59e0b" bg="#fef3c7" />
          <StatCard title="Top Selling Product" value={stats?.topSellingProduct || "-"} icon={<Star />} color="#8b5cf6" bg="#ede9fe" />
      </Box>

      {/* 2. MAIN CHARTS ROW (Revenue vs Payment Methods) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 3 }}>
        
        {/* Sales & Profit Trend */}
        <Paper sx={{ p: 3, borderRadius: 3, height: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Avatar sx={{ bgcolor: '#ecfdf5', color: '#10b981', width: 32, height: 32 }}><ShowChart fontSize="small" /></Avatar>
                <Typography variant="h6" fontWeight="bold">Weekly Revenue vs Profit</Typography>
            </Box>
            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={stats?.salesTrend || []}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="top" height={36}/>
                    <Area type="monotone" dataKey="total" name="Sales" stroke="#10b981" strokeWidth={3} fill="url(#colorSales)" />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="#3b82f6" strokeWidth={3} fill="url(#colorProfit)" />
                </AreaChart>
            </ResponsiveContainer>
        </Paper>

        {/* Payment Methods (Donut) */}
        <Paper sx={{ p: 3, borderRadius: 3, height: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6', width: 32, height: 32 }}><PieIcon fontSize="small" /></Avatar>
                <Typography variant="h6" fontWeight="bold">Payment Methods</Typography>
            </Box>
            <Box height="70%" position="relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats?.paymentStats || []}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {(stats?.paymentStats || []).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
                {/* Centered Total Text */}
                <Box position="absolute" top="50%" left="50%" sx={{ transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary">Total</Typography>
                </Box>
            </Box>
        </Paper>

      </Box>

      {/* 3. BOTTOM ROW (Top Products & Recent Sales) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.5fr" }, gap: 3 }}>
          
          {/* Top 5 Products Bar Chart */}
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', minHeight: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <Avatar sx={{ bgcolor: '#f5f3ff', color: '#8b5cf6', width: 32, height: 32 }}><ShoppingBag fontSize="small" /></Avatar>
                    <Typography variant="h6" fontWeight="bold">Top 5 Products (Qty)</Typography>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart layout="vertical" data={stats?.topProducts || []} margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#475569'}} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }}/>
                        <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
          </Paper>

          {/* Recent Transactions Table */}
          <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
                <Box p={3} borderBottom="1px solid #f1f5f9" display="flex" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">Recent Transactions</Typography>
                    <Button size="small">View All</Button>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Time</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Customer</TableCell>
                                <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600 }}>Amount</TableCell>
                                <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stats?.recentSales && stats.recentSales.length > 0 ? (
                                stats.recentSales.map((sale) => (
                                <TableRow key={sale.id} hover>
                                    <TableCell sx={{ color: '#475569' }}>{formatTime(sale.time)}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{sale.customer}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Rs. {sale.amount.toLocaleString()}</TableCell>
                                    <TableCell align="right">
                                        <Chip 
                                            label={sale.status} 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: sale.status === 'Paid' ? '#dcfce7' : '#fef9c3', 
                                                color: sale.status === 'Paid' ? '#166534' : '#854d0e',
                                                fontWeight: 600, fontSize: 11
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>No sales today</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
          </Paper>
      </Box>
    </Box>
  );
}

// Reusable Card with sleek design
const StatCard = ({ title, value, icon, color, bg }: any) => (
  <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: 0.5 }}>{title.toUpperCase()}</Typography>
      <Typography variant="h5" fontWeight="800" color="#1e293b" mt={0.5}>{value}</Typography>
    </Box>
    <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
    </Box>
  </Paper>
);