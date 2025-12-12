import { useState } from "react";
import axios from "axios";
import { 
  Button, 
  TextField, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress,
  Container
} from "@mui/material";
import { Storefront, Lock } from "@mui/icons-material";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- API URL ---
  const API_URL = "https://zentra-backend-production-557c.up.railway.app/api/Auth/login";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // UPDATED LINK HERE
      const response = await axios.post(API_URL, {
        username: username,
        password: password,
      });

      localStorage.setItem("token", response.data.token);
      // Optional: Save shop name if backend sends it, otherwise default
      localStorage.setItem("shopName", "ZentraRetail"); 
      
      window.location.href = "/dashboard";

    } catch (err: any) {
      console.error(err);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        bgcolor: "#f5f5f5" 
      }}
    >
      <Container maxWidth="xs">
        <Card sx={{ boxShadow: 3, borderTop: "4px solid #10b981" }}>
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            
            {/* Logo Icon */}
            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
              <Box sx={{ p: 2, bgcolor: "#e0f2f1", borderRadius: "50%" }}>
                <Storefront sx={{ fontSize: 40, color: "#10b981" }} />
              </Box>
            </Box>

            {/* BRAND NAME */}
            <Typography variant="h4" component="h1" fontWeight="bold" color="#333" gutterBottom>
              ZentraRetail
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Sign in to your management console
            </Typography>

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                size="large"
                disabled={loading}
                sx={{ 
                  mt: 2, 
                  bgcolor: "#10b981", 
                  "&:hover": { bgcolor: "#059669" }, 
                  height: 50,
                  fontWeight: "bold"
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
              </Button>
            </form>

          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}