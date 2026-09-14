import React, { useState, useEffect } from "react";
import api from "../api"; // Instance axios Anda
import UserManagement from "./user_management";
import GroupPages from "./groups_pages";
import APIEndpointManager from "./api_endpoints_pages";
import AttendancePages from "./Attendance_pages";
import BiometricEnrollmentPages from "./BiometricEnrollmentPages";
import AttendanceScannerPages from "./AttedanceScannerPages";
import ContractPage from "./Contract_pages";
import AttendancePage from "./ZktecoAttendance_pagess";
import CronjobPage from "./cronjob_pages";
import EmployeePage from "./Employee_pages";
import CompanyPage from "./company_pages";
import DepartmentPage from "./department_pages";
import SectionPage from "./section_pages";
import PositionPage from "./position_pages";
import OnboardingPage1 from "./onboarding_pages";
import EmployeeEditStagingPage from "./EmployeeStagging_pages";
import AreaPage from "./Area_pages";

export default function DashboardApp({
  onNavigateToOnboarding,
  pemicuKeluar,
}) {
  const [activeMenu, setActiveMenu] = useState("welcome");

  const [userPermissions, setUserPermissions] = useState({
    isSuperuser: false,
    allowedCodenames: [],
  });
  const [loadingPermissions, setLoadingPermissions] = useState(true);

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

  const hasAccess = (codename) => {
    if (userPermissions.isSuperuser) return true;
    if (userPermissions.allowedCodenames.includes("*")) return true;
    return userPermissions.allowedCodenames.includes(codename);
  };

  // ==========================================
  // COMPONENT WELCOMING PAGE INTERNAL
  // ==========================================
  const WelcomePage = () => (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {/* CARD BANNER UCAPAN SELAMAT DATANG */}
      <div style={welcomeBannerStyle}>
        <div>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "22px" }}>
            Selamat Datang di Portal HRIS 👋
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "14px", lineHeight: "1.5" }}>
            Sistem Informasi Sumber Daya Manusia Terintegrasi. Kelola master data karyawan, 
            pengajuan *Maker-Checker Staging*, serta pemetaan absensi biometrik ZKTeco BioTime secara terpusat.
          </p>
        </div>
      </div>

      {/* QUICK STATS / RINGKASAN MODUL */}
      <h3 style={{ fontSize: "16px", color: "#1e293b", margin: "25px 0 15px 0" }}>
        Akses Cepat Modul Utama
      </h3>

      <div style={quickGridStyle}>
        {!loadingPermissions && hasAccess("EmployeeRead") && (
          <div style={quickCardStyle} onClick={() => setActiveMenu("employee")}>
            <div style={{ ...iconBadgeStyle, background: "#dbeafe", color: "#2563eb" }}>👥</div>
            <div>
              <h4 style={cardTitleStyle}>Master Employee</h4>
              <p style={cardDescStyle}>Kelola data demografi, biodata, & pemetaan ZK BioTime.</p>
            </div>
          </div>
        )}

        {!loadingPermissions && hasAccess("employeeStaggingRead") && (
          <div style={quickCardStyle} onClick={() => setActiveMenu("employeestagging")}>
            <div style={{ ...iconBadgeStyle, background: "#fef3c7", color: "#d97706" }}>📝</div>
            <div>
              <h4 style={cardTitleStyle}>Employee Edit Request</h4>
              <p style={cardDescStyle}>Persetujuan perubahan data (*Maker-Checker Staging*).</p>
            </div>
          </div>
        )}

        {!loadingPermissions && hasAccess("ZKTecoAttendanceRead") && (
          <div style={quickCardStyle} onClick={() => setActiveMenu("zkteco-attendance")}>
            <div style={{ ...iconBadgeStyle, background: "#dcfce7", color: "#16a34a" }}>⏰</div>
            <div>
              <h4 style={cardTitleStyle}>ZKTeco Attendance</h4>
              <p style={cardDescStyle}>Sinkronisasi logs transaksi mesin absensi biometrik.</p>
            </div>
          </div>
        )}

        {!loadingPermissions && hasAccess("CompanyAccess") && (
          <div style={quickCardStyle} onClick={() => setActiveMenu("company")}>
            <div style={{ ...iconBadgeStyle, background: "#f3e8ff", color: "#9333ea" }}>🏢</div>
            <div>
              <h4 style={cardTitleStyle}>Master Company</h4>
              <p style={cardDescStyle}>Kelola entitas perusahaan dan cabang organisasi.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // RENDER CONTENT DINAMIS BERDASARKAN activeMenu
  const renderContent = () => {
    switch (activeMenu) {
      case "welcome":
        return <WelcomePage />;
      case "company":
        return <CompanyPage />;
      case "department":
        return <DepartmentPage />;
      case "section":
        return <SectionPage />;
      case "area":
        return <AreaPage />;
      case "position":
        return <PositionPage />;
      case "employee":
        return <EmployeePage />;
      case "employeestagging":
        return <EmployeeEditStagingPage />;
      case "onboarding":
        return <OnboardingPage1 />;
      case "contractlist":
        return <ContractPage />;
      case "attendance":
        return <AttendancePages />;
      case "attendace-scanner":
        return <AttendanceScannerPages />;
      case "biometric-enrollment":
        return <BiometricEnrollmentPages />;
      case "zkteco-attendance":
        return <AttendancePage />;
      case "user-management":
        return <UserManagement />;
      case "group-pages":
        return <GroupPages />;
      case "api-endpoints":
        return hasAccess("APIEndpointsAccess") ? (
          <APIEndpointManager />
        ) : (
          <p style={{ color: "#ef4444" }}>Anda tidak memiliki akses ke halaman ini.</p>
        );
      case "cronjob-page":
        return <CronjobPage />;
      default:
        return <WelcomePage />;
    }
  };

  return (
    <div style={layoutStyle}>
      {/* SIDEBAR */}
      <aside style={sidebarStyle}>
        <div 
          style={{ ...logoStyle, cursor: "pointer" }} 
          onClick={() => setActiveMenu("welcome")}
          title="Kembali ke Dashboard Utama"
        >
          <h2 style={{ margin: 0 }}>HRIS</h2>
          <small>Human Resources System</small>
        </div>

        <div style={{ marginTop: "30px", flex: 1, overflowY: "auto" }}>
          <button
            onClick={() => setActiveMenu("welcome")}
            style={{
              ...menuButtonStyle,
              ...(activeMenu === "welcome" ? activeMenuStyle : {}),
            }}
          >
            🏠 Dashboard Home
          </button>

          <p style={sectionTitleStyle}>MASTER DATA</p>
          {!loadingPermissions && hasAccess("CompanyAccess") && (
            <button
              onClick={() => setActiveMenu("company")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "company" ? activeMenuStyle : {}),
              }}
            >
              Company
            </button>
          )}
          {!loadingPermissions && hasAccess("DepartmentRead") && (
            <button
              onClick={() => setActiveMenu("department")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "department" ? activeMenuStyle : {}),
              }}
            >
              Department
            </button>
          )}
          {!loadingPermissions && hasAccess("SectionRead") && (
            <button
              onClick={() => setActiveMenu("section")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "section" ? activeMenuStyle : {}),
              }}
            >
              Section
            </button>
          )}
          {!loadingPermissions && hasAccess("AreaRead") && (
            <button
              onClick={() => setActiveMenu("area")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "area" ? activeMenuStyle : {}),
              }}
            >
              Area
            </button>
          )}
          {!loadingPermissions && hasAccess("PositionRead") && (
            <button
              onClick={() => setActiveMenu("position")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "position" ? activeMenuStyle : {}),
              }}
            >
              Position
            </button>
          )}
          {!loadingPermissions && hasAccess("EmployeeRead") && (
            <button
              onClick={() => setActiveMenu("employee")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "employee" ? activeMenuStyle : {}),
              }}
            >
              Employee
            </button>
          )}
          {!loadingPermissions && hasAccess("employeeStaggingRead") && (
            <button
              onClick={() => setActiveMenu("employeestagging")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "employeestagging" ? activeMenuStyle : {}),
              }}
            >
              Employee Edit Request List
            </button>
          )}
          {!loadingPermissions && hasAccess("OnboardingRead") && (
            <button
              onClick={() => setActiveMenu("onboarding")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "onboarding" ? activeMenuStyle : {}),
              }}
            >
              Onboarding List
            </button>
          )}
          {!loadingPermissions && hasAccess("ContractRead") && (
            <button
              onClick={() => setActiveMenu("contractlist")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "contractlist" ? activeMenuStyle : {}),
              }}
            >
              Contract
            </button>
          )}
          {!loadingPermissions && hasAccess("AttendaceRead") && (
            <button
              onClick={() => setActiveMenu("attendance")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "attendance" ? activeMenuStyle : {}),
              }}
            >
              Attendance
            </button>
          )}
          {!loadingPermissions && hasAccess("AttendanceScannerAccess") && (
            <button
              onClick={() => setActiveMenu("attendace-scanner")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "attendace-scanner" ? activeMenuStyle : {}),
              }}
            >
              Attendance Scanner
            </button>
          )}
          {!loadingPermissions && hasAccess("BiometricEnrollmentAccess") && (
            <button
              onClick={() => setActiveMenu("biometric-enrollment")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "biometric-enrollment" ? activeMenuStyle : {}),
              }}
            >
              Biometric Enrollment
            </button>
          )}
          {!loadingPermissions && hasAccess("ZKTecoAttendanceRead") && (
            <button
              onClick={() => setActiveMenu("zkteco-attendance")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "zkteco-attendance" ? activeMenuStyle : {}),
              }}
            >
              ZKTeco Attendance
            </button>
          )}

          <p style={{ ...sectionTitleStyle, marginTop: "20px" }}>SYSTEM</p>

          <button onClick={onNavigateToOnboarding} style={menuButtonStyle}>
            Onboarding Portal
          </button>
          {!loadingPermissions && hasAccess("UserAccess") && (
            <button
              onClick={() => setActiveMenu("user-management")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "user-management" ? activeMenuStyle : {}),
              }}
            >
              User Management
            </button>
          )}
          {!loadingPermissions && hasAccess("GroupsAccess") && (
            <button
              onClick={() => setActiveMenu("group-pages")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "group-pages" ? activeMenuStyle : {}),
              }}
            >
              Groups & Access
            </button>
          )}
          {!loadingPermissions && hasAccess("APIEndpointsAccess") && (
            <button
              onClick={() => setActiveMenu("api-endpoints")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "api-endpoints" ? activeMenuStyle : {}),
              }}
            >
              API Endpoints List
            </button>
          )}
          {!loadingPermissions && hasAccess("CronJobAccess") && (
            <button
              onClick={() => setActiveMenu("cronjob-page")}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === "cronjob-page" ? activeMenuStyle : {}),
              }}
            >
              Auto Scheduler / Cronjob
            </button>
          )}
        </div>

        {/* LOGOUT */}
        <div style={logoutContainerStyle}>
          <button onClick={pemicuKeluar} style={logoutButtonStyle}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={mainStyle}>
        {/* HEADER */}
        <header style={headerStyle}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", color: "#0f172a" }}>HRIS Dashboard</h1>
            <p style={subtitleStyle}>Human Resource Information System</p>
          </div>
          <div style={userBadgeStyle}>
            {userPermissions.isSuperuser ? "Super Admin" : "User Access"}
          </div>
        </header>

        {/* DYNAMIC CONTENT */}
        <section>{renderContent()}</section>
      </main>
    </div>
  );
}

// STYLES DENGAN WAKTU DAN LOGIKA DESAIN KONSISTEN
const layoutStyle = { display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "Arial, sans-serif" };
const sidebarStyle = { width: "230px", background: "#0f172a", color: "#fff", padding: "25px 15px", display: "flex", flexDirection: "column", boxSizing: "border-box" };
const logoStyle = { padding: "0 10px" };
const sectionTitleStyle = { fontSize: "11px", color: "#94a3b8", fontWeight: "bold", padding: "0 10px", letterSpacing: "1px", marginTop: "15px" };
const menuButtonStyle = { display: "block", width: "100%", padding: "10px 12px", marginBottom: "4px", border: "none", borderRadius: "6px", background: "transparent", color: "#cbd5e1", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "500" };
const activeMenuStyle = { background: "#2563eb", color: "#fff", fontWeight: "bold" };
const logoutContainerStyle = { marginTop: "auto", paddingTop: "15px" };
const logoutButtonStyle = { width: "100%", padding: "10px", border: "1px solid #334155", borderRadius: "6px", background: "#1e293b", color: "#fff", cursor: "pointer", fontWeight: "bold" };
const mainStyle = { flex: 1, padding: "30px", boxSizing: "border-box", minWidth: 0, overflowX: "hidden" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" };
const subtitleStyle = { marginTop: "4px", color: "#64748b", fontSize: "13px" };
const userBadgeStyle = { background: "#e2e8f0", color: "#334155", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" };

// STYLES KHUSUS WELCOMING PAGE
const welcomeBannerStyle = {
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  color: "#ffffff",
  padding: "24px 30px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
};

const quickGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
};

const quickCardStyle = {
  backgroundColor: "#ffffff",
  padding: "20px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  display: "flex",
  gap: "16px",
  alignItems: "center",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const iconBadgeStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  flexShrink: 0,
};

const cardTitleStyle = { margin: "0 0 4px 0", fontSize: "15px", color: "#0f172a" };
const cardDescStyle = { margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" };