import React, { useState } from "react";
import GenericCrudManager from "../components/GenericCrudManager";
import UserManagement from "./user_management";
import GroupPages from "./groups_pages";


export default function DashboardApp({
  onNavigateToOnboarding,
  pemicuKeluar,
}) {
  const [activeMenu, setActiveMenu] = useState("company");

  // Konfigurasi menu CRUD
  const menus = [
    {
      key: "company",
      label: "Company",
    },
    {
      key: "department",
      label: "Department",
    },
    {
      key: "section",
      label: "Section",
    },
    {
      key: "position",
      label: "Position",
    },
    {
      key: "employee",
      label: "Employee",
    },
  ];

  // Konfigurasi CRUD Company
  const companyFields = [
    {
      key: "name",
      label: "Nama Company",
      type: "text",
      required: true,
    },
    {
      key: "company_code",
      label: "Company Code",
      type: "text",
      required: true,
    },
    {
      key: "address",
      label: "Alamat",
      type: "text",
      required: false,
    },
    {
      key: "phone_number",
      label: "Nomor Telepon",
      type: "text",
      required: true,
    },
    {
      key: "number",
      label: "Number",
      type: "text",
      required: true,
    },
  ];

  // Konfigurasi CRUD Department
  const departmentFields = [
    {
      key: "name",
      label: "Nama Department",
      type: "text",
      required: true,
    },
  ];

  // Konfigurasi CRUD Section
  const sectionFields = [
    {
      key: "name",
      label: "Nama Section",
      type: "text",
      required: true,
    },
  ];

  // Konfigurasi CRUD Position
  const positionFields = [
    {
      key: "name",
      label: "Nama Position",
      type: "text",
      required: true,
    },
  ];

  // Konfigurasi CRUD Employee
  const employeeFields = [
    {
      key: "nik_karyawan",
      label: "NIK Karyawan",
      type: "text",
      required: true,
    },
    {
      key: "nama_lengkap",
      label: "Nama Lengkap",
      type: "text",
      required: true,
    },
  ];

  // Tentukan CRUD yang sedang aktif
  const renderContent = () => {
    switch (activeMenu) {
      case "company":
        return (
          <GenericCrudManager
            title="Company"
            endpoint="/api/v1/onboarding/companies/"
            fields={companyFields}
          />
        );

      case "department":
        return (
          <GenericCrudManager
            title="Department"
            endpoint="/api/v1/onboarding/departments/"
            fields={departmentFields}
          />
        );

      case "section":
        return (
          <GenericCrudManager
            title="Section"
            endpoint="/api/v1/onboarding/sections/"
            fields={sectionFields}
          />
        );

      case "position":
        return (
          <GenericCrudManager
            title="Position"
            endpoint="/api/v1/onboarding/positions/"
            fields={positionFields}
          />
        );

      case "employee":
        return (
          <GenericCrudManager
            title="Employee"
            endpoint="/api/v1/onboarding/employees/"
            fields={employeeFields}
          />
        );
      case "user-management":
        return (
          <UserManagement />        
        );
      case "group-pages":
        return (
          <GroupPages />        
        );

      default:
        return null;
    }
  };

  return (
    <div style={layoutStyle}>

      {/* SIDEBAR */}
      <aside style={sidebarStyle}>

        <div style={logoStyle}>
          <h2 style={{ margin: 0 }}>HRIS</h2>
          <small>Human Resources</small>
        </div>

        <div style={{ marginTop: "30px" }}>

          <p style={sectionTitleStyle}>
            MASTER DATA
          </p>

          {menus.map((menu) => (
            <button
              key={menu.key}
              onClick={() => setActiveMenu(menu.key)}
              style={{
                ...menuButtonStyle,
                ...(activeMenu === menu.key
                  ? activeMenuStyle
                  : {}),
              }}
            >
              {menu.label}
            </button>
          ))}

          <p style={{ ...sectionTitleStyle, marginTop: "30px" }}>
            SYSTEM
          </p>

          <button
            onClick={onNavigateToOnboarding}
            style={menuButtonStyle}
          >
            Onboarding
          </button>
          <button
            onClick={() => setActiveMenu("user-management")}
            style={{
              ...menuButtonStyle,
              ...(activeMenu === "user-management"
                ? activeMenuStyle
                : {}),
            }}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveMenu("group-pages")}
            style={{
              ...menuButtonStyle,
              ...(activeMenu === "group-pages"
                ? activeMenuStyle
                : {}),
            }}
          >
            Groups
          </button>

        </div>

        {/* LOGOUT */}
        <div style={logoutContainerStyle}>
          <button
            onClick={pemicuKeluar}
            style={logoutButtonStyle}
          >
            Logout
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main style={mainStyle}>

        {/* HEADER */}
        <header style={headerStyle}>

          <div>
            <h1 style={{ margin: 0 }}>
              HRIS Dashboard
            </h1>

            <p style={subtitleStyle}>
              Human Resource Information System
            </p>
          </div>

          <div style={userBadgeStyle}>
            Admin
          </div>

        </header>

        {/* CONTENT */}
        <section>
          {renderContent()}
        </section>

      </main>

    </div>
  );
}


// ==============================
// STYLES
// ==============================

const layoutStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "#f8fafc",
  fontFamily: "Arial, sans-serif",
};


// SIDEBAR

const sidebarStyle = {
  width: "230px",
  background: "#0f172a",
  color: "#fff",
  padding: "25px 15px",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};

const logoStyle = {
  padding: "0 10px",
};

const sectionTitleStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  fontWeight: "bold",
  padding: "0 10px",
  letterSpacing: "1px",
};

const menuButtonStyle = {
  display: "block",
  width: "100%",
  padding: "11px 12px",
  marginBottom: "5px",
  border: "none",
  borderRadius: "5px",
  background: "transparent",
  color: "#cbd5e1",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "14px",
};

const activeMenuStyle = {
  background: "#2563eb",
  color: "#fff",
};

const logoutContainerStyle = {
  marginTop: "auto",
};

const logoutButtonStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #475569",
  borderRadius: "5px",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
};


// MAIN

const mainStyle = {
  flex: 1,
  padding: "30px",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px",
};

const subtitleStyle = {
  marginTop: "5px",
  color: "#64748b",
  fontSize: "14px",
};

const userBadgeStyle = {
  background: "#e2e8f0",
  padding: "8px 15px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "bold",
};
