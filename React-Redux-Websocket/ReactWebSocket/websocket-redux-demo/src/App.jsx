import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import darkTheme from "./theme/darkTheme";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import FlatsPage from "./pages/FlatsPage";
import BuildingsPage from "./pages/BuildingsPage";

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/flats" element={<FlatsPage />} />
          <Route path="/buildings" element={<BuildingsPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
