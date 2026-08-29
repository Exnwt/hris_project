// import React, { useState } from "react";
// import axios from "axios";
// import { setTokenKeMemory } from "../api";

// function LoginPage({ pemicuMasuk }) {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");

//   const kirimPayloadLogin = () => {
//     setErrorMsg("");
//     // PERBAIKAN: URL diperbaiki ke endpoint token login Django
//     axios.post("http://127.0.0.1:8000/api/token/", {
//       username: username,
//       password: password
//     })
//     .then((response) => {
//       setTokenKeMemory(response.data.access); // Ambil access token ke RAM
//       if (pemicuMasuk) pemicuMasuk(); // Pindah ke dashboard
//     })
//     .catch(() => {
//       setErrorMsg("Kredensial salah atau koneksi API terputus.");
//     });
//   };

//   return (
//     <div style={{ padding: "30px", maxWidth: "320px", margin: "100px auto", border: "1px solid #ccc", fontFamily: "Arial" }}>
//       <h3>HRIS API LOGIN</h3>
//       {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
//       <div style={{ marginBottom: "10px" }}>
//         <label>Username:</label>
//         <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", padding: "5px" }} />
//       </div>
//       <div style={{ marginBottom: "15px" }}>
//         <label>Password:</label>
//         <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "5px" }} />
//       </div>
//       <button onClick={kirimPayloadLogin} style={{ width: "100%", padding: "10px", backgroundColor: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
//         Kirim Kredensial via POST API
//       </button>
//     </div>
//   );
// }

// export default LoginPage;

import React, { useState } from "react";
import { login } from "../auth/auth";


export default function LoginPage({ pemicuMasuk }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  const handleLogin = async (e) => {

    e.preventDefault();

    setErrorMsg("");
    setLoading(true);

    try {

      const result = await login(
        username,
        password
      );

      console.log("Login berhasil");
      console.log("Access token:", result.access);

      if (pemicuMasuk) {
        pemicuMasuk();
      }

    } catch (error) {

      console.error(error);

      if (error.response?.status === 401) {

        setErrorMsg(
          "Username atau password salah."
        );

      } else {

        setErrorMsg(
          "Tidak dapat terhubung ke server."
        );
      }

    } finally {

      setLoading(false);

    }
  };


  return (
    <div style={pageStyle}>

      <div style={loginBoxStyle}>

        <h2>HRIS Login</h2>

        {errorMsg && (
          <div style={errorStyle}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div style={fieldStyle}>

            <label>
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
            />

          </div>


          <div style={fieldStyle}>

            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

          </div>


          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
          >

            {loading
              ? "Login..."
              : "Login"}

          </button>

        </form>

      </div>

    </div>
  );
}


const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f1f5f9",
};


const loginBoxStyle = {
  width: "350px",
  padding: "30px",
  background: "white",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
};


const fieldStyle = {
  marginBottom: "15px",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
};


const buttonStyle = {
  width: "100%",
  padding: "10px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};


const errorStyle = {
  padding: "10px",
  marginBottom: "15px",
  background: "#fee2e2",
  color: "#991b1b",
  borderRadius: "5px",
};