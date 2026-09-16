import React, { useState, useEffect } from "react";
import api from "../api";
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
    <div>
      {/* BANNER UCAPAN SELAMAT DATANG */}
      <div className="welcome-banner">
        <div>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "22px" }}>
            Selamat Datang di Portal HRIS 👋
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "14px", lineHeight: "1.5" }}>
            Sistem Informasi Sumber Daya Manusia Terintegrasi. Kelola master data karyawan, 
            pengajuan <em>Maker-Checker Staging</em>, serta pemetaan absensi biometrik ZKTeco BioTime secara terpusat.
          </p>
        </div>
      </div>

      {/* QUICK STATS / RINGKASAN MODUL */}
      <h3 style={{ fontSize: "16px", color: "#1e293b", margin: "25px 0 15px 0" }}>
        Akses Cepat Modul Utama
      </h3>

      <div className="quick-grid">
        {!loadingPermissions && hasAccess("EmployeeRead") && (
          <div className="quick-card" onClick={() => setActiveMenu("employee")}>
            <div className="icon-badge" style={{ background: "#dbeafe", color: "#2563eb" }}>👥</div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#0f172a" }}>Master Employee</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                Kelola data demografi, biodata, & pemetaan ZK BioTime.
              </p>
            </div>
          </div>
        )}

        {!loadingPermissions && hasAccess("employeeStaggingRead") && (
          <div className="quick-card" onClick={() => setActiveMenu("employeestagging")}>
            <div className="icon-badge" style={{ background: "#fef3c7", color: "#d97706" }}>📝</div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#0f172a" }}>Employee Edit Request</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                Persetujuan perubahan data (<em>Maker-Checker Staging</em>).
              </p>
            </div>
          </div>
        )}

        {!loadingPermissions && hasAccess("ZKTecoAttendanceRead") && (
          <div className="quick-card" onClick={() => setActiveMenu("zkteco-attendance")}>
            <div className="icon-badge" style={{ background: "#dcfce7", color: "#16a34a" }}>⏰</div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#0f172a" }}>ZKTeco Attendance</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                Sinkronisasi logs transaksi mesin absensi biometrik.
              </p>
            </div>
          </div>
        )}

        {!loadingPermissions && hasAccess("CompanyAccess") && (
          <div className="quick-card" onClick={() => setActiveMenu("company")}>
            <div className="icon-badge" style={{ background: "#f3e8ff", color: "#9333ea" }}>🏢</div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#0f172a" }}>Master Company</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                Kelola entitas perusahaan dan cabang organisasi.
              </p>
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
      // case "attendance":
      //   return <AttendancePages />;
      // case "attendace-scanner":
      //   return <AttendanceScannerPages />;
      // case "biometric-enrollment":
      //   return <BiometricEnrollmentPages />;
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
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div 
          className="sidebar-logo"
          onClick={() => setActiveMenu("welcome")}
          title="Kembali ke Dashboard Utama"
        >
          <h2>HRIS</h2>
          <small>Human Resources System</small>
        </div>

        <div className="sidebar-menu-container">
          <button
            onClick={() => setActiveMenu("welcome")}
            className={`btn-sidebar-menu ${activeMenu === "welcome" ? "active" : ""}`}
          >
            🏠 Dashboard Home
          </button>

          <p className="sidebar-section-title">MASTER DATA</p>
          {!loadingPermissions && hasAccess("CompanyAccess") && (
            <button
              onClick={() => setActiveMenu("company")}
              className={`btn-sidebar-menu ${activeMenu === "company" ? "active" : ""}`}
            >
              Company
            </button>
          )}
          {!loadingPermissions && hasAccess("DepartmentRead") && (
            <button
              onClick={() => setActiveMenu("department")}
              className={`btn-sidebar-menu ${activeMenu === "department" ? "active" : ""}`}
            >
              Department
            </button>
          )}
          {!loadingPermissions && hasAccess("SectionRead") && (
            <button
              onClick={() => setActiveMenu("section")}
              className={`btn-sidebar-menu ${activeMenu === "section" ? "active" : ""}`}
            >
              Section
            </button>
          )}
          {!loadingPermissions && hasAccess("AreaRead") && (
            <button
              onClick={() => setActiveMenu("area")}
              className={`btn-sidebar-menu ${activeMenu === "area" ? "active" : ""}`}
            >
              Area
            </button>
          )}
          {!loadingPermissions && hasAccess("PositionRead") && (
            <button
              onClick={() => setActiveMenu("position")}
              className={`btn-sidebar-menu ${activeMenu === "position" ? "active" : ""}`}
            >
              Position
            </button>
          )}
          {!loadingPermissions && hasAccess("EmployeeRead") && (
            <button
              onClick={() => setActiveMenu("employee")}
              className={`btn-sidebar-menu ${activeMenu === "employee" ? "active" : ""}`}
            >
              Employee
            </button>
          )}
          {!loadingPermissions && hasAccess("employeeStaggingRead") && (
            <button
              onClick={() => setActiveMenu("employeestagging")}
              className={`btn-sidebar-menu ${activeMenu === "employeestagging" ? "active" : ""}`}
            >
              Employee Edit Request List
            </button>
          )}
          {!loadingPermissions && hasAccess("OnboardingRead") && (
            <button
              onClick={() => setActiveMenu("onboarding")}
              className={`btn-sidebar-menu ${activeMenu === "onboarding" ? "active" : ""}`}
            >
              Onboarding List
            </button>
          )}
          {!loadingPermissions && hasAccess("ContractRead") && (
            <button
              onClick={() => setActiveMenu("contractlist")}
              className={`btn-sidebar-menu ${activeMenu === "contractlist" ? "active" : ""}`}
            >
              Contract
            </button>
          )}
          {!loadingPermissions && hasAccess("AttendaceRead") && (
            <button
              onClick={() => setActiveMenu("attendance")}
              className={`btn-sidebar-menu ${activeMenu === "attendance" ? "active" : ""}`}
            >
              Attendance
            </button>
          )}
          {!loadingPermissions && hasAccess("AttendanceScannerAccess") && (
            <button
              onClick={() => setActiveMenu("attendace-scanner")}
              className={`btn-sidebar-menu ${activeMenu === "attendace-scanner" ? "active" : ""}`}
            >
              Attendance Scanner
            </button>
          )}
          {!loadingPermissions && hasAccess("BiometricEnrollmentAccess") && (
            <button
              onClick={() => setActiveMenu("biometric-enrollment")}
              className={`btn-sidebar-menu ${activeMenu === "biometric-enrollment" ? "active" : ""}`}
            >
              Biometric Enrollment
            </button>
          )}
          {!loadingPermissions && hasAccess("ZKTecoAttendanceRead") && (
            <button
              onClick={() => setActiveMenu("zkteco-attendance")}
              className={`btn-sidebar-menu ${activeMenu === "zkteco-attendance" ? "active" : ""}`}
            >
              ZKTeco Attendance
            </button>
          )}

          <p className="sidebar-section-title">SYSTEM</p>

          <button onClick={onNavigateToOnboarding} className="btn-sidebar-menu">
            Onboarding Portal
          </button>
          {!loadingPermissions && hasAccess("UserAccess") && (
            <button
              onClick={() => setActiveMenu("user-management")}
              className={`btn-sidebar-menu ${activeMenu === "user-management" ? "active" : ""}`}
            >
              User Management
            </button>
          )}
          {!loadingPermissions && hasAccess("GroupsAccess") && (
            <button
              onClick={() => setActiveMenu("group-pages")}
              className={`btn-sidebar-menu ${activeMenu === "group-pages" ? "active" : ""}`}
            >
              Groups & Access
            </button>
          )}
          {!loadingPermissions && hasAccess("APIEndpointsAccess") && (
            <button
              onClick={() => setActiveMenu("api-endpoints")}
              className={`btn-sidebar-menu ${activeMenu === "api-endpoints" ? "active" : ""}`}
            >
              API Endpoints List
            </button>
          )}
          {!loadingPermissions && hasAccess("CronJobAccess") && (
            <button
              onClick={() => setActiveMenu("cronjob-page")}
              className={`btn-sidebar-menu ${activeMenu === "cronjob-page" ? "active" : ""}`}
            >
              Auto Scheduler / Cronjob
            </button>
          )}
        </div>

        {/* LOGOUT */}
        <div className="sidebar-logout-container">
          <button onClick={pemicuKeluar} className="btn-sidebar-logout">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", color: "#0f172a" }}>HRIS Dashboard</h1>
            <p style={{ marginTop: "4px", color: "#64748b", fontSize: "13px" }}>
              Human Resource Information System
            </p>
          </div>
          <div className="user-badge">
            {userPermissions.isSuperuser ? "Super Admin" : "User Access"}
          </div>
        </header>

        {/* DYNAMIC CONTENT */}
        <section>{renderContent()}</section>
      </main>
    </div>
  );
}