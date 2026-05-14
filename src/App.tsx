import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute } from "./shared/guards/PrivateRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ReservationsPage } from "./pages/ReservationsPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<ReservationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
