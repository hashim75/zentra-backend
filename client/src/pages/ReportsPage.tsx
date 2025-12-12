import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { 
  Box, Container, Typography, Paper, Button, TextField, CircularProgress, 
  Avatar, Chip
} from "@mui/material";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { 
  AccessTime, People, Inventory, PictureAsPdf, Search, TrendingUp, 
  MonetizationOn, ShoppingCart, Repeat, Timeline
} from "@mui/icons-material";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Types (Matches New Backend DTO) ---
interface ReportData {
  // Financials
  totalRevenue: number;
  totalExpenses: number;
  netCashFlow: number;
  totalProfit: number;
  inventoryCostValue: number;
  projectedProfitValue: number;
  
  // Scaling Metrics (NEW)
  salesGrowthPercentage: number;
  averageBasketValue: number;
  customerRetentionRate: number;
  totalTransactions: number;

  // Charts
  peakHours: { hour: string; amount: number; count: number }[];
  productPerformance: { name: string; sold: number; margin: number; category: string }[];
  topCustomers: { name: string; visits: number; spent: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Date Filters
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateFrom, setDateFrom] = useState(firstDay.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);

  // Ref for PDF Capture
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5097/api/Reports/generate", {
        from: dateFrom,
        to: dateTo
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // --- PDF EXPORT ---
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Advanced_Report_${dateFrom}.pdf`);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: 4 }}>
      <Container maxWidth="xl">
        
        {/* HEADER */}
        <Box display="flex" flexDirection={{xs: 'column', md: 'row'}} justifyContent="space-between" alignItems="center" mb={4} gap={2}>
            <Box>
                <Typography variant="h4" fontWeight="800" color="#1e293b">Business Intelligence</Typography>
                <Typography variant="body2" color="text.secondary">Deep dive into growth, retention, and profitability.</Typography>
            </Box>
            
            <Paper sx={{ p: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField label="From" type="date" size="small" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <TextField label="To" type="date" size="small" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                <Button variant="contained" onClick={fetchReports} startIcon={<Search />}>Run Analysis</Button>
                <Button variant="outlined" color="error" onClick={handleDownloadPDF} startIcon={<PictureAsPdf />}>PDF</Button>
            </Paper>
        </Box>

        {loading ? <Box py={10} textAlign="center"><CircularProgress /></Box> : data && (
            
            // --- PDF CAPTURE AREA ---
            <Box ref={reportRef} sx={{ bgcolor: '#f8fafc', p: 1, display: "flex", flexDirection: "column", gap: 4 }}> 
                
                {/* 1. FINANCIAL HEALTH (4 Cols) */}
                <Box>
                    <Typography variant="h6" fontWeight="bold" mb={2} color="text.secondary">💰 Financial Health</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr" }, gap: 3 }}>
                        <SummaryCard title="Total Revenue" value={`Rs. ${data.totalRevenue.toLocaleString()}`} color="#10b981" bg="#d1fae5" icon={<MonetizationOn />} />
                        <SummaryCard title="Net Profit (Actual)" value={`Rs. ${data.totalProfit.toLocaleString()}`} color="#3b82f6" bg="#dbeafe" icon={<TrendingUp />} />
                        <SummaryCard title="Net Cash Flow" value={`Rs. ${data.netCashFlow.toLocaleString()}`} color="#f59e0b" bg="#fef3c7" icon={<Inventory />} />
                        <SummaryCard title="Inventory Asset" value={`Rs. ${data.inventoryCostValue.toLocaleString()}`} color="#8b5cf6" bg="#ede9fe" icon={<Inventory />} />
                    </Box>
                </Box>

                {/* 2. SCALING METRICS (4 Cols) - NEW SECTION */}
                <Box>
                    <Typography variant="h6" fontWeight="bold" mb={2} color="text.secondary">🚀 Growth & Efficiency</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr" }, gap: 3 }}>
                        <SummaryCard 
                            title="Sales Growth (MoM)" 
                            value={`${data.salesGrowthPercentage > 0 ? '+' : ''}${data.salesGrowthPercentage}%`} 
                            color={data.salesGrowthPercentage >= 0 ? "#10b981" : "#ef4444"} 
                            bg={data.salesGrowthPercentage >= 0 ? "#ecfdf5" : "#fef2f2"} 
                            icon={<Timeline />} 
                        />
                        <SummaryCard title="Avg Basket Size" value={`Rs. ${data.averageBasketValue.toLocaleString()}`} color="#6366f1" bg="#e0e7ff" icon={<ShoppingCart />} />
                        <SummaryCard title="Customer Retention" value={`${data.customerRetentionRate}%`} color="#d946ef" bg="#fae8ff" icon={<Repeat />} />
                        <SummaryCard title="Total Transactions" value={data.totalTransactions.toString()} color="#0ea5e9" bg="#e0f2fe" icon={<Inventory />} />
                    </Box>
                </Box>

                {/* 3. CHARTS ROW (Peak Hours + Customers) */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 3 }}>
                    
                    {/* Peak Hours Chart */}
                    <Paper sx={{ p: 3, borderRadius: 3, height: 420, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                            <Avatar sx={{ bgcolor: '#fff7ed', color: '#f97316' }}><AccessTime /></Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">Peak Business Hours</Typography>
                                <Typography variant="caption" color="text.secondary">Optimize your staffing based on traffic.</Typography>
                            </Box>
                        </Box>
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={data.peakHours}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: 8}} />
                                <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} name="Sales (Rs)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>

                    {/* VIP Customers List */}
                    <Paper sx={{ p: 3, borderRadius: 3, height: 420, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                            <Avatar sx={{ bgcolor: '#ecfdf5', color: '#10b981' }}><People /></Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">Top 5 VIPs</Typography>
                                <Typography variant="caption" color="text.secondary">Most valuable customers.</Typography>
                            </Box>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={2} sx={{ overflowY: 'auto' }}>
                            {data.topCustomers.length === 0 ? <Typography align="center" mt={5} color="text.secondary">No customer data.</Typography> : 
                             data.topCustomers.map((c, i) => (
                                <Box key={i} display="flex" justifyContent="space-between" alignItems="center" p={1.5} bgcolor="#f8fafc" borderRadius={2}>
                                    <Box>
                                        <Typography fontWeight="bold" fontSize={14}>{c.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{c.visits} Visits</Typography>
                                    </Box>
                                    <Typography fontWeight="bold" color="primary">Rs. {c.spent.toLocaleString()}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Box>

                {/* 4. PROFIT MATRIX (Scatter Plot) */}
                <Paper sx={{ p: 3, borderRadius: 3, height: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                        <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6' }}><Inventory /></Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Product Profitability Matrix</Typography>
                            <Typography variant="caption" color="text.secondary">
                                <span style={{color: '#10b981'}}>● Star (High Profit)</span> | 
                                <span style={{color: '#ef4444'}}> ● Loss (Low Profit)</span> |
                                <span style={{color: '#3b82f6'}}> ● Volume (Fast Moving)</span>
                            </Typography>
                        </Box>
                    </Box>
                    <ResponsiveContainer width="100%" height="85%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="sold" name="Units Sold" unit=" pcs" />
                            <YAxis type="number" dataKey="margin" name="Profit Margin" unit="%" />
                            <ZAxis type="category" dataKey="name" name="Product" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <Paper sx={{ p: 2, border: '1px solid #ccc' }}>
                                            <Typography fontWeight="bold">{d.name}</Typography>
                                            <Typography variant="body2">Sold: {d.sold}</Typography>
                                            <Typography variant="body2">Margin: {d.margin}%</Typography>
                                            <Chip label={d.category} size="small" sx={{mt:1}} color="primary" />
                                        </Paper>
                                    );
                                }
                                return null;
                            }} />
                            <Scatter name="Products" data={data.productPerformance} fill="#8884d8">
                                {data.productPerformance.map((entry, index) => {
                                    let fill = '#8884d8';
                                    if(entry.category === 'Star') fill = '#10b981'; // Green
                                    else if(entry.category === 'Volume') fill = '#3b82f6'; // Blue
                                    else if(entry.category === 'Loss') fill = '#ef4444'; // Red
                                    else if(entry.category === 'Potential') fill = '#8b5cf6'; // Purple
                                    return <Cell key={`cell-${index}`} fill={fill} />;
                                })}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </Paper>

            </Box>
        )}
      </Container>
    </Box>
  );
}

// Reusable Summary Card
const SummaryCard = ({ title, value, color, bg, icon }: any) => (
    <Paper sx={{ p: 3, borderRadius: 3, borderLeft: `5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Box>
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Typography>
            <Typography variant="h4" fontWeight="800" color="#1e293b" mt={0.5}>{value}</Typography>
        </Box>
        <Avatar sx={{ bgcolor: bg, color: color, width: 50, height: 50 }}>
            {icon}
        </Avatar>
    </Paper>
);