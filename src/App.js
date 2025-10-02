import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthGuard from "./auth/auth.guard";
import LoginPage from "./auth/LoginPage";
import ElectionsPage from "./elections/ElectionsPage";
import CreateElectionPage from "./elections/CreateElectionPage";
import CreateConfigPage from "./configs/CreateConfigPage";
import ConfigListPage from "./configs/ConfigListPage";
import ElectionLiveStatsPage from "./elections/ElectionLiveStatsPage";
import ElectionResetPage from "./election-reset/ElectionResetPage";
import { createContext, useEffect, useState } from "react";
import ElectionResultPage from "./elections/ElectionResultPage";

export const UserContext = createContext(null);

function App() {
    const [role, setRole] = useState(null);

    useEffect(() => {
        const savedRole = localStorage.getItem("evm.role");
        if (savedRole) setRole(savedRole);
    }, []);

    useEffect(() => {
        if (role) {
            localStorage.setItem("evm.role", role);
        } else {
            localStorage.removeItem("evm.role");
        }
    }, [role]);

    return (
        <UserContext.Provider value={{ role, setRole }}>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<AuthGuard><ElectionsPage /></AuthGuard>} />
                    <Route path="/create-election" element={<CreateElectionPage />} />
                    <Route path="/create-config" element={<CreateConfigPage />} />
                    <Route path="/configs" element={<ConfigListPage />} />
                    <Route path="/election-live-stats/:electionId" element={<ElectionLiveStatsPage />} />
                    <Route path="/election-reset/:flag" element={<ElectionResetPage />} />
                    <Route path="/election-result/:electionId" element={<ElectionResultPage />} />
                </Routes>
            </Router>
        </UserContext.Provider>
    );
}

export default App;
