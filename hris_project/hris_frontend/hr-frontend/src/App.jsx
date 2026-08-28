import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardApp from "./pages/DashboardApp";
import OnboardingPage from "./pages/OnboardingPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('DASHBOARD'); // 'DASHBOARD' | 'ONBOARDING'

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('DASHBOARD');
  };

  if (!isLoggedIn) {
    return <LoginPage pemicuMasuk={() => setIsLoggedIn(true)} />;
  }

  if (currentView === 'ONBOARDING') {
    return (
      <OnboardingPage 
        onNavigateToDashboard={() => setCurrentView('DASHBOARD')}
        pemicuKeluar={handleLogout}
      />
    );
  }

  return (
    <DashboardApp 
      onNavigateToOnboarding={() => setCurrentView('ONBOARDING')}
      pemicuKeluar={handleLogout} 
    />
  );
}

export default App;