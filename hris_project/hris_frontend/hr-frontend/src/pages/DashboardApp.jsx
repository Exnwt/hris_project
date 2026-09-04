import React, { useState, useEffect } from "react";
import api from "../api"; // Instance axios Anda
import GenericCrudManager from "../components/GenericCrudManager";
import UserManagement from "./user_management";
import GroupPages from "./groups_pages";
import APIEndpointManager from "./api_endpoints_pages";
import AttendancePages from "./Attendance_pages";
import BiometricEnrollmentPages from "./BiometricEnrollmentPages";
import AttendanceScannerPages from "./AttedanceScannerPages";
import ContractPage from "./Contract_pages";
import AttendancePage from "./ZktecoAttendance_pagess";
import CronjobPage from "./cronjob_pages";

export default function DashboardApp({
  onNavigateToOnboarding,
  pemicuKeluar,
}) {
  const [activeMenu, setActiveMenu] = useState("company");

  // State untuk menyimpan daftar hak akses user
  const [userPermissions, setUserPermissions] = useState({
    isSuperuser: false,
    allowedCodenames: [],
  });
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // State untuk menyimpan opsi Dropdown (Company, Department, Section, Position)
  const [masterOptions, setMasterOptions] = useState({
    companies: [],
    departments: [],
    sections: [],
    positions: [],
  });

  // ==========================================
  // FETCH USER PERMISSIONS SAAT LOAD
  // ==========================================
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get("api/v2/access/my-permissions/");
        setUserPermissions({
          isSuperuser: response.data.is_superuser,
          allowedCodenames: response.data.allowed_codenames || [],
        });
      } catch (error) {
        console.error("Gagal mengambil permission user:", error);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, []);

  // ==========================================
  // FETCH MASTER DATA UNTUK DROPDOWN EMPLOYEE
  // ==========================================
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [compRes, deptRes, secRes, posRes] = await Promise.all([
          api.get("/api/v1/onboarding/companies/"),
          api.get("/api/v1/onboarding/departments/"),
          api.get("/api/v1/onboarding/sections/"),
          api.get("/api/v1/onboarding/positions/"),
        ]);

        const compList = compRes.data.results || compRes.data || [];
        const deptList = deptRes.data.results || deptRes.data || [];
        const secList = secRes.data.results || secRes.data || [];
        const posList = posRes.data.results || posRes.data || [];

        setMasterOptions({
          companies: compList.map((item) => ({ value: item.id, label: item.name })),
          departments: deptList.map((item) => ({ value: item.id, label: item.name })),
          sections: secList.map((item) => ({ value: item.id, label: item.name })),
          positions: posList.map((item) => ({ value: item.id, label: item.name })),
        });
      } catch (error) {
        console.error("Gagal memuat master data dropdown:", error);
      }
    };

    fetchMasterData();
  }, []);

  // Helper function untuk cek apakah user punya hak akses tertentu
  const hasAccess = (codename) => {
    if (userPermissions.isSuperuser) return true;
    return userPermissions.allowedCodenames.includes(codename);
  };

  // Konfigurasi menu CRUD Master Data
  const companyFields = [
    { key: "name", label: "Nama Company", type: "text", required: true },
    { key: "company_code", label: "Company Code", type: "text", required: true },
    { key: "address", label: "Alamat", type: "text", required: false },
    { key: "phone_number", label: "Nomor Telepon", type: "text", required: true },
    { key: "number", label: "Number", type: "text", required: true },
  ];

  const departmentFields = [{ key: "name", label: "Nama Department", type: "text", required: true }];
  const sectionFields = [{ key: "name", label: "Nama Section", type: "text", required: true }];
  const positionFields = [{ key: "name", label: "Nama Position", type: "text", required: true }];

  // KONFIGURASI EMPLOYEE FIELDS DENGAN SELECT DROPDOWN DINAMIS & PERSYARATAN BACKEND
  const employeeFields = [
    { key: "nik_karyawan", label: "NIK Karyawan", type: "text", required: true },
    { key: "nama_lengkap", label: "Nama Lengkap", type: "text", required: true },
    { key: "join_date", label: "Tanggal Bergabung", type: "date", required: true },
    {
      key: "jenis_kelamin",
      label: "Jenis Kelamin",
      type: "select",
      required: true,
      options: [
        { value: "L", label: "Laki-laki" },
        { value: "P", label: "Perempuan" },
      ],
    },
    { key: "tempat_lahir", label: "Tempat Lahir", type: "text", required: true },
    { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date", required: true },
    {
      key: "pendidikan",
      label: "Pendidikan Terakhir",
      type: "select",
      required: true,
      options: [
        { value: "SMA", label: "SMA/Sederajat" },
        { value: "D3", label: "Diploma 3" },
        { value: "S1", label: "S1" },
        { value: "S2", label: "S2" },
        { value: "S3", label: "S3" },
        { value: "LAINNYA", label: "Lainnya" },
      ],
    },

    // Dropdown Select yang diambil langsung dari API Master Data
    {
      key: "company",
      label: "Company",
      type: "select",
      required: true,
      options: masterOptions.companies,
    },
    {
      key: "department",
      label: "Department",
      type: "select",
      required: true,
      options: masterOptions.departments,
    },
    {
      key: "section",
      label: "Section",
      type: "select",
      required: false,
      options: masterOptions.sections,
    },
    {
      key: "position",
      label: "Position",
      type: "select",
      required: true,
      options: masterOptions.positions,
    },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case "company":
        return <GenericCrudManager title="Company" endpoint="/api/v1/onboarding/companies/" fields={companyFields} />;
      case "department":
        return <GenericCrudManager title="Department" endpoint="/api/v1/onboarding/departments/" fields={departmentFields} />;
      case "section":
        return <GenericCrudManager title="Section" endpoint="/api/v1/onboarding/sections/" fields={sectionFields} />;
      case "position":
        return <GenericCrudManager title="Position" endpoint="/api/v1/onboarding/positions/" fields={positionFields} />;
      case "employee":
        return <GenericCrudManager title="Employee" endpoint="/api/v1/onboarding/employees/" fields={employeeFields} />;
      case "contractlist":
        return <ContractPage />;
      case "attendance":
        return <AttendancePages />;
      case "attendace-scanner":
        return <AttendanceScannerPages />;
      case "biometric-enrollment":
        return <BiometricEnrollmentPages />;
      case "zkteco-attendance":
        return <AttendancePage/>;
      case "user-management":
        return <UserManagement />;
      case "group-pages":
        return <GroupPages />;
      case "api-endpoints":
        return hasAccess("APIEndpoints") ? <APIEndpointManager /> : <p>Anda tidak memiliki akses ke halaman ini.</p>;
      case "cronjob-page":
        return <CronjobPage/>;
      default:
        return null;
    }
  };

  const menus = [
    { key: "company", label: "Company" },
    { key: "department", label: "Department" },
    { key: "section", label: "Section" },
    { key: "position", label: "Position" },
    { key: "employee", label: "Employee" },
  ];

  return (
    <div style={layoutStyle}>
      {/* SIDEBAR */}
      <aside style={sidebarStyle}>
        <div style={logoStyle}>
          <h2 style={{ margin: 0 }}>HRIS</h2>
          <small>Human Resources</small>
        </div>

        <div style={{ marginTop: "30px" }}>
          <p style={sectionTitleStyle}>MASTER DATA</p>

          {menus.map((menu) => (
            <button
              key={menu.key}
              onClick={() => setActiveMenu(menu.key)}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === menu.key ? activeMenuStyle : {}),
              }}
            >
              {menu.label}
            </button>
          ))}
          <button
            onClick={() => setActiveMenu("contractlist")}
            style={{
              ...menuButtonStyle,
              ...(activeMenu === "contractlist" ? activeMenuStyle : {}),
            }}
          >
            Contract
          </button>
          <button
            onClick={() => setActiveMenu("attendance")}
            style={{
              ...menuButtonStyle,
              ...(activeMenu === "attendance" ? activeMenuStyle : {}),
            }}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveMenu("attendace-scanner")}
            style={{
              ...menuButtonStyle,
              ...(activeMenu === "attendace-scanner" ? activeMenuStyle : {}),
            }}
          >
            Attendance Scanner
          </button>
          <button
            onClick={() => setActiveMenu("biometric-enrollment")}
            style={{
              ...menuButtonStyle,
              ...(activeMenu === "biometric-enrollment" ? activeMenuStyle : {}),
            }}
          >
            Biometric Enrollment
          </button>
          <button
            onClick={() => setActiveMenu("zkteco-attendance")}
            style={{
              ...menuButtonStyle,
              ...(activeMenu === "zkteco-attendance" ? activeMenuStyle : {}),
            }}
          >
            Zkteco Attendance
          </button>

          <p style={{ ...sectionTitleStyle, marginTop: "30px" }}>SYSTEM</p>

          <button onClick={onNavigateToOnboarding} style={menuButtonStyle}>
            Onboarding
          </button>
          <button
            onClick={() => setActiveMenu("user-management")}
            style={{
              ...menuButtonStyle,
              ...(activeMenu === "user-management" ? activeMenuStyle : {}),
            }}
          >
            User Management
          </button>
          {!loadingPermissions && hasAccess("Groups") && (
            <button
              onClick={() => setActiveMenu("group-pages")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "group-pages" ? activeMenuStyle : {}),
              }}
            >
              Groups
            </button>
          )}
          {!loadingPermissions && hasAccess("APIEndpoints") && (
            <button
              onClick={() => setActiveMenu("api-endpoints")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "api-endpoints" ? activeMenuStyle : {}),
              }}
            >
              API List
            </button>
          )}
          <button
                onClick={() => setActiveMenu("cronjob-page")}
                style={{
                  ...menuButtonStyle,
                  ...(activeMenu === "cronjob-page" ? activeMenuStyle : {}),
                }}
              >
                Auto Scheuduler / Cronjob
          </button>
        </div>

        {/* LOGOUT */}
        <div style={logoutContainerStyle}>
          <button onClick={pemicuKeluar} style={logoutButtonStyle}>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={mainStyle}>
        {/* HEADER */}
        <header style={headerStyle}>
          <div>
            <h1 style={{ margin: 0 }}>HRIS Dashboard</h1>
            <p style={subtitleStyle}>Human Resource Information System</p>
          </div>
          <div style={userBadgeStyle}>
            {userPermissions.isSuperuser ? "Super Admin" : "User"}
          </div>
        </header>

        {/* CONTENT */}
        <section>{renderContent()}</section>
      </main>
    </div>
  );
}

// STYLES
const layoutStyle = { display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "Arial, sans-serif" };
const sidebarStyle = { width: "230px", background: "#0f172a", color: "#fff", padding: "25px 15px", display: "flex", flexDirection: "column", boxSizing: "border-box" };
const logoStyle = { padding: "0 10px" };
const sectionTitleStyle = { fontSize: "11px", color: "#94a3b8", fontWeight: "bold", padding: "0 10px", letterSpacing: "1px" };
const menuButtonStyle = { display: "block", width: "100%", padding: "11px 12px", marginBottom: "5px", border: "none", borderRadius: "5px", background: "transparent", color: "#cbd5e1", textAlign: "left", cursor: "pointer", fontSize: "14px" };
const activeMenuStyle = { background: "#2563eb", color: "#fff" };
const logoutContainerStyle = { marginTop: "auto" };
const logoutButtonStyle = { width: "100%", padding: "10px", border: "1px solid #475569", borderRadius: "5px", background: "transparent", color: "#fff", cursor: "pointer" };
const mainStyle = {
  flex: 1,
  padding: "30px",
  boxSizing: "border-box",
  minWidth: 0,          // Mencegah flexbox meluap ke kanan
  overflowX: "hidden"   // Memastikan tidak ada horizontal scrollbar luar
};
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const subtitleStyle = { marginTop: "5px", color: "#64748b", fontSize: "14px" };
const userBadgeStyle = { background: "#e2e8f0", padding: "8px 15px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" };