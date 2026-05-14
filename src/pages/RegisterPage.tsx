import { RegisterForm } from "../features/auth/components/RegisterForm";
import bananaLogo from "../assets/BANANALTDA.svg";

export function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-visual register" aria-hidden="true">
        <div className="brand-lockup">
          <img src={bananaLogo} alt="" />
        </div>
      </section>
      <RegisterForm />
    </main>
  );
}
