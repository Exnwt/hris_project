import React, { useState } from "react";
import axios from "axios";
import { setTokenKeMemory } from "../api";

function LoginPage({ pemicuMasuk }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const kirimPayloadLogin = () => {
    setErrorMsg("");
    // PERBAIKAN: URL diperbaiki ke endpoint token login Django
    axios.post("http://127.0.0.1:8000/api/token/", {
      username: username,
      password: password
    })
    .then((response) => {
      setTokenKeMemory(response.data.access); // Ambil access token ke RAM
      if (pemicuMasuk) pemicuMasuk(); // Pindah ke dashboard
    })
    .catch(() => {
      setErrorMsg("Kredensial salah atau koneksi API terputus.");
    });
  };

  return (
    <div style={{ padding: "30px", maxWidth: "320px", margin: "100px auto", border: "1px solid #ccc", fontFamily: "Arial" }}>
      <h3>HRIS API LOGIN</h3>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <div style={{ marginBottom: "10px" }}>
        <label>Username:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", padding: "5px" }} />
      </div>
      <div style={{ marginBottom: "15px" }}>
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "5px" }} />
      </div>
      <button onClick={kirimPayloadLogin} style={{ width: "100%", padding: "10px", backgroundColor: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
        Kirim Kredensial via POST API
      </button>
    </div>
  );
}

export default LoginPage;