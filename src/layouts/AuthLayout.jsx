// src/layouts/AuthLayout.jsx
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import "../styles/AuthLayout.css";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page d-flex flex-column min-vh-100">
      <Header />
      <main className="auth-page__main flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="auth-page__stage">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
