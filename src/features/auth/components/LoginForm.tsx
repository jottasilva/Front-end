import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../../../shared/components/LoadingSpinner";
import { useToast } from "../../../shared/contexts/ToastContext";

export function LoginForm() {
  const { login, isLoading } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("jefferson@teste.com");
  const [password, setPassword] = useState("teste123");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !password) {
      toast.warning("Campos obrigatorios", "Informe email e senha para entrar.");
      return;
    }

    try {
      await login({ email, password });
    } catch {
      toast.error("Login nao realizado", "Email ou senha invalidos.");
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <h1>Entrar</h1>
        <p>Acesse sua agenda de salas e continue suas reservas.</p>
      </div>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="jefferson@teste.com"
          autoComplete="email"
        />
      </label>

      <label>
        Senha
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Sua senha"
          autoComplete="current-password"
        />
      </label>

      <button className="primary-button full-width" type="submit" disabled={isLoading}>
        {isLoading ? <LoadingSpinner /> : <LogIn size={18} />}
        Entrar
      </button>

      <p className="auth-switch">
        Ainda nao tem conta? <Link to="/register">Criar cadastro</Link>
      </p>
    </form>
  );
}
