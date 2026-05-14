import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../../../shared/components/LoadingSpinner";
import { useToast } from "../../../shared/contexts/ToastContext";

function hasStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

export function RegisterForm() {
  const { register, isLoading } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.warning("Campos obrigatorios", "Preencha todos os campos para criar sua conta.");
      return;
    }

    if (!hasStrongPassword(password)) {
      toast.warning("Senha fraca", "A senha precisa ter 8 caracteres, 1 maiuscula e 1 numero.");
      return;
    }

    if (password !== confirmPassword) {
      toast.warning("Confirmacao invalida", "A confirmacao de senha nao confere.");
      return;
    }

    try {
      await register({ name, email, password });
    } catch {
      toast.error("Cadastro nao realizado", "Nao foi possivel criar a conta. Verifique os dados informados.");
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <h1>Criar conta</h1>
        <p>Cadastre-se para reservar salas e acompanhar sua agenda.</p>
      </div>

      <label>
        Nome
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Usuário Teste" />
      </label>

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
          placeholder="Minimo 8 caracteres"
          autoComplete="new-password"
        />
      </label>

      <label>
        Confirmar senha
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repita sua senha"
          autoComplete="new-password"
        />
      </label>

      <button className="primary-button full-width" type="submit" disabled={isLoading}>
        {isLoading ? <LoadingSpinner /> : <UserPlus size={18} />}
        Criar conta
      </button>

      <p className="auth-switch">
        Ja tem conta? <Link to="/login">Entrar</Link>
      </p>
    </form>
  );
}
