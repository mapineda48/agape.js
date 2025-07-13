import { useState } from "react";

export default function SignUp() {
  // Datos personales
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Datos de empleado
  const [hireDate, setHireDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");

  // Datos de acceso
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estado del formulario
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback("");

    if (password !== confirmPassword) {
      setFeedback("❌ Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: {
            firstName,
            lastName,
            birthdate,
            email,
            phone,
          },
          employee: {
            hireDate,
            isActive,
            avatarUrl,
          },
          access: {
            username,
            password,
          },
        }),
      });

      if (res.ok) {
        setFeedback("✅ Usuario administrador registrado correctamente.");
      } else {
        const error = await res.text();
        setFeedback(`❌ Error: ${error}`);
      }
    } catch (err) {
      setFeedback("❌ Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded space-y-6"
    >
      <h2 className="text-3xl font-bold mb-4 text-center">Registrar Administrador</h2>

      {/* Datos Personales */}
      <fieldset className="border border-gray-300 rounded p-4">
        <legend className="text-lg font-semibold px-2">Datos Personales</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block font-medium mb-1">Nombre</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Apellido</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Fecha de nacimiento</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Correo electrónico</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Teléfono</label>
            <input
              type="tel"
              className="w-full border rounded px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>
      </fieldset>

      {/* Datos de Empleado */}
      <fieldset className="border border-gray-300 rounded p-4">
        <legend className="text-lg font-semibold px-2">Datos de Empleado</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block font-medium mb-1">Fecha de contratación</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
            />
            <label className="font-medium">Activo</label>
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Avatar URL</label>
            <input
              type="url"
              className="w-full border rounded px-3 py-2"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="/admin.jpg"
            />
          </div>
        </div>
      </fieldset>

      {/* Datos de Acceso */}
      <fieldset className="border border-gray-300 rounded p-4">
        <legend className="text-lg font-semibold px-2">Datos de Acceso</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block font-medium mb-1">Nombre de usuario</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Confirmar contraseña</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? "Registrando..." : "Registrar Administrador"}
      </button>

      {feedback && (
        <p className="mt-4 text-center text-sm text-gray-700">{feedback}</p>
      )}
    </form>
  );
}
