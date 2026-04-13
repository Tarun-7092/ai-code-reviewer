import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input, Button, Alert } from "../components/ui";
import styles from "./Auth.module.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={styles.gridLine} style={{ left: `${i * 6.25}%` }} />
        ))}
      </div>

      <div className={styles.box + " fade-in"}>
        <div className={styles.header}>
          <div className={styles.logoMark}>CS</div>
          <h1 className={styles.title}>CodeScan</h1>
          <p className={styles.sub}>Create your account</p>
        </div>

        <div className={styles.terminal}>
          <div className={styles.termBar}>
            <span /><span /><span />
            <code className={styles.termTitle}>auth.register</code>
          </div>
          <form className={styles.form} onSubmit={submit}>
            {error && <Alert type="error">{error}</Alert>}
            <Input label="Full Name" type="text" value={form.name} onChange={set("name")} placeholder="Ada Lovelace" required />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="user@example.com" required />
            <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="min. 6 characters" required />
            <Button type="submit" loading={loading} style={{ width: "100%", marginTop: 4 }}>
              {loading ? "Creating account..." : "$ register --new"}
            </Button>
          </form>
        </div>

        <p className={styles.foot}>
          Have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
