import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuthUser } from "../App";
import { backendClient as backend } from "../backendClient";

interface Props {
  onLogin: (user: AuthUser) => void;
}

export default function AuthPage({ onLogin }: Props) {
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    setLoginLoading(true);
    try {
      const token = await backend.login(loginForm.username, loginForm.password);
      if (!token) throw new Error("Credenciales inválidas");
      const sessionResult = await backend.validateSession(token);
      if (!sessionResult) throw new Error("Sesión inválida");
      const [principal, role] = sessionResult;
      const profile = await backend.getCallerUserProfile();
      onLogin({
        principal: principal.toString(),
        role,
        username: profile?.username || loginForm.username,
        token,
      });
      toast.success("¡Bienvenido de vuelta!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al iniciar sesión",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.username || !regForm.email || !regForm.password) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    setRegisterLoading(true);
    try {
      await backend.register(
        regForm.username,
        regForm.email,
        regForm.password,
        regForm.role,
      );
      toast.success("¡Cuenta creada! Ahora puedes iniciar sesión.");
      // Auto login
      const token = await backend.login(regForm.username, regForm.password);
      const sessionResult = await backend.validateSession(token);
      if (sessionResult) {
        const [principal, role] = sessionResult;
        onLogin({
          principal: principal.toString(),
          role,
          username: regForm.username,
          token,
        });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #0B1F33 0%, #071726 60%, #0B1F33 100%)",
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: "#C8A24A", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-5"
          style={{ background: "#C8A24A", filter: "blur(60px)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: "rgba(200,162,74,0.15)",
              border: "1px solid rgba(200,162,74,0.3)",
            }}
          >
            <Shield className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            SEGUROS PREMIUM
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Sistema de Cotización Profesional
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
          }}
        >
          <Tabs defaultValue="login">
            <TabsList
              className="w-full mb-6"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <TabsTrigger
                value="login"
                className="flex-1 text-white/60 data-[state=active]:text-white"
                style={{}}
                data-ocid="auth.login.tab"
              >
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 text-white/60 data-[state=active]:text-white"
                data-ocid="auth.register.tab"
              >
                Registrarse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <AnimatePresence mode="wait">
                <motion.form
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm">Usuario</Label>
                    <Input
                      data-ocid="auth.login.input"
                      placeholder="tu_usuario"
                      value={loginForm.username}
                      onChange={(e) =>
                        setLoginForm((p) => ({
                          ...p,
                          username: e.target.value,
                        }))
                      }
                      className="bg-white/8 border-white/15 text-white placeholder:text-white/30 focus:border-gold"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderColor: "rgba(255,255,255,0.12)",
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm">Contraseña</Label>
                    <div className="relative">
                      <Input
                        data-ocid="auth.login.password.input"
                        type={showLoginPwd ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((p) => ({
                            ...p,
                            password: e.target.value,
                          }))
                        }
                        className="pr-10"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          borderColor: "rgba(255,255,255,0.12)",
                          color: "white",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPwd((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                      >
                        {showLoginPwd ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    data-ocid="auth.login.submit_button"
                    disabled={loginLoading}
                    className="w-full mt-2 font-semibold"
                    style={{ background: "#C8A24A", color: "#0B1F33" }}
                  >
                    {loginLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {loginLoading ? "Iniciando..." : "Iniciar Sesión"}
                  </Button>
                </motion.form>
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="register">
              <AnimatePresence mode="wait">
                <motion.form
                  key="register"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm">Usuario</Label>
                    <Input
                      data-ocid="auth.register.username.input"
                      placeholder="tu_usuario"
                      value={regForm.username}
                      onChange={(e) =>
                        setRegForm((p) => ({ ...p, username: e.target.value }))
                      }
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderColor: "rgba(255,255,255,0.12)",
                        color: "white",
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm">
                      Correo Electrónico
                    </Label>
                    <Input
                      data-ocid="auth.register.email.input"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={regForm.email}
                      onChange={(e) =>
                        setRegForm((p) => ({ ...p, email: e.target.value }))
                      }
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderColor: "rgba(255,255,255,0.12)",
                        color: "white",
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm">Contraseña</Label>
                    <div className="relative">
                      <Input
                        data-ocid="auth.register.password.input"
                        type={showRegPwd ? "text" : "password"}
                        placeholder="••••••••"
                        value={regForm.password}
                        onChange={(e) =>
                          setRegForm((p) => ({
                            ...p,
                            password: e.target.value,
                          }))
                        }
                        className="pr-10"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          borderColor: "rgba(255,255,255,0.12)",
                          color: "white",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPwd((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                      >
                        {showRegPwd ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-sm">
                      Tipo de cuenta
                    </Label>
                    <select
                      data-ocid="auth.register.role.select"
                      value={regForm.role}
                      onChange={(e) =>
                        setRegForm((p) => ({ ...p, role: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderColor: "rgba(255,255,255,0.12)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <option value="user" style={{ background: "#0B1F33" }}>
                        Agente / Usuario
                      </option>
                      <option value="admin" style={{ background: "#0B1F33" }}>
                        Administrador
                      </option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    data-ocid="auth.register.submit_button"
                    disabled={registerLoading}
                    className="w-full mt-2 font-semibold"
                    style={{ background: "#C8A24A", color: "#0B1F33" }}
                  >
                    {registerLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {registerLoading ? "Registrando..." : "Crear Cuenta"}
                  </Button>
                </motion.form>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/60 hover:text-gold transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
