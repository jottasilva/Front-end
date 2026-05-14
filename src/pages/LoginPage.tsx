import { LoginForm } from "../features/auth/components/LoginForm";
import bananaLogo from "../assets/BANANALTDA.svg";

export function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-hidden="true">
        <div className="brand-lockup">
          <img src={bananaLogo} alt="" />
        </div>
      </section>
      <LoginForm />
    </main>
  );
}
