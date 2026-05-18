"use client";

import { useState, useEffect } from "react";
import { 
  Users, Package, TrendingUp, DollarSign, Gavel, Truck, 
  Activity, Search, Filter, ArrowUpRight, ArrowDownRight,
  Leaf, ShoppingBag, MapPin, Calendar, Clock, BarChart2,
  ShieldAlert, Zap, Download, Settings, LogOut, CheckCircle, 
  AlertTriangle, RefreshCw, XCircle, UserCheck, Shield, Menu, X
} from "lucide-react";
import styles from "./page.module.css";
import { signOut, useSession } from "next-auth/react";
import { 
  getAdminMetrics, 
  deleteProductAdmin, 
  updateAadhaarStatus 
} from "@/app/actions/adminActions";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: session } = useSession();

  const handleDeleteAccount = async () => {
    const identifier = session?.user?.email || session?.user?.name || "admin";
    const confirmed = window.confirm(
      "WARNING: Are you absolutely sure you want to permanently delete your admin account? This will wipe your profile, system settings, and all administrative controls. This cannot be undone."
    );
    if (!confirmed) return;

    setLoading(true);
    const { deleteUserAccount } = await import("@/app/actions/userActions");
    const res = await deleteUserAccount(identifier);
    if (res.success) {
      alert("Your admin account was successfully deleted. Redirecting to home...");
      signOut({ callbackUrl: "/" });
    } else {
      alert("Error deleting account: " + res.error);
      setLoading(false);
    }
  };

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Simulated Interactive States for Complaints
  const [complaints, setComplaints] = useState([
    { id: "TKT-1024", title: "Organic Strawberries Delayed Delivery", user: "Shop Owner (shop1)", type: "Logistics", status: "PENDING", date: "May 17, 2026" },
    { id: "TKT-1025", title: "Bargain dispute: Crop quality report variance", user: "Farmer (sivanagu)", type: "Bargain", status: "PENDING", date: "May 17, 2026" },
    { id: "TKT-1026", title: "Cold Storage temperature threshold anomaly", user: "Delivery (del1)", type: "Logistics", status: "RESOLVED", date: "May 16, 2026" }
  ]);

  // Simulated Interactive States for Fraud Alerts
  const [fraudAlerts, setFraudAlerts] = useState([
    { id: "FRD-3041", title: "Unusual route deviation detected for MH-12-PQ-8874", severity: "HIGH", status: "ACTIVE", date: "10 mins ago" },
    { id: "FRD-3042", title: "Rapid repeat bargain bids from shop1@agri.com", severity: "MEDIUM", status: "ACTIVE", date: "45 mins ago" },
    { id: "FRD-3043", title: "Multiple account login mismatch detected from same IP", severity: "LOW", status: "DISMISSED", date: "2 hrs ago" }
  ]);

  // Simulated Account Suspensions (Active/Suspended Toggle)
  const [suspendedUsers, setSuspendedUsers] = useState<Record<string, boolean>>({});

  // System Settings state
  const [systemSettings, setSystemSettings] = useState({
    autoModCrops: true,
    requireAadhaar: true,
    alertThreshold: "MEDIUM",
    maintenanceMode: false
  });

  async function loadData() {
    setLoading(true);
    const res = await getAdminMetrics();
    if (res.success) {
      setMetrics(res);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Farmer Aadhaar Approval Action
  const handleAadhaarVerification = async (profileId: string, name: string) => {
    const mockAadhaar = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const res = await updateAadhaarStatus(profileId, mockAadhaar);
    if (res.success) {
      triggerToast(`Aadhaar verified successfully for Farmer: ${name}!`);
      loadData();
    } else {
      triggerToast("Failed to verify Aadhaar.", "error");
    }
  };

  // Product Moderation Delete/Remove Action
  const handleProductModeration = async (productId: string, name: string) => {
    const res = await deleteProductAdmin(productId);
    if (res.success) {
      triggerToast(`Product '${name}' moderated and removed successfully!`);
      loadData();
    } else {
      triggerToast("Failed to moderate product.", "error");
    }
  };

  // Toggle User Suspension state
  const toggleSuspension = (userId: string, email: string) => {
    const isCurrentlySuspended = !!suspendedUsers[userId];
    setSuspendedUsers({ ...suspendedUsers, [userId]: !isCurrentlySuspended });
    triggerToast(
      isCurrentlySuspended 
        ? `Account ${email} activated successfully!` 
        : `Account ${email} suspended successfully.`,
      isCurrentlySuspended ? "success" : "error"
    );
  };

  // Resolve Complaint Action
  const handleResolveComplaint = (tktId: string) => {
    setComplaints(complaints.map(c => c.id === tktId ? { ...c, status: "RESOLVED" } : c));
    triggerToast(`Complaint ticket ${tktId} resolved successfully.`);
  };

  // Dismiss Fraud Alert Action
  const handleDismissFraud = (alertId: string) => {
    setFraudAlerts(fraudAlerts.map(f => f.id === alertId ? { ...f, status: "DISMISSED" } : f));
    triggerToast(`Anomaly alert ${alertId} dismissed safely.`);
  };

  // Simulate Report CSV Export (Triggers real file download!)
  const handleExportCSV = () => {
    if (!metrics) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Operational Control Report - AgriConnect Platform\n";
    csvContent += `Generated At,${new Date().toLocaleString()}\n\n`;
    csvContent += "Category,Count/Value\n";
    csvContent += `Total Registered Farmers,${metrics.farmers}\n`;
    csvContent += `Total Shop Owners,${metrics.shopOwners}\n`;
    csvContent += `Total Delivery Partners,${metrics.agents}\n`;
    csvContent += `Active Listings (Harvests),${metrics.totalHarvests}\n`;
    csvContent += `Total volume (INR),₹${metrics.totalVolume}\n`;
    csvContent += `Bargain Negotiations,${metrics.totalDeals}\n`;
    csvContent += `Active Complaints,${complaints.filter(c=>c.status==='PENDING').length}\n`;
    csvContent += `Unresolved Fraud Anomalies,${fraudAlerts.filter(f=>f.status==='ACTIVE').length}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `agriconnect_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast("Excel-compatible CSV operational report downloaded successfully!");
  };

  // Tab switcher wrapper that auto-closes mobile navigation drawer
  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  if (loading || !metrics) return (
    <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 2rem' }}></div>
        <h2 style={{ fontWeight: 800, color: '#1e293b' }}>Aggregating Global Operational Control Metrics...</h2>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* TOAST FEEDBACK */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1100,
          background: toast.type === 'success' ? '#6366f1' : '#ef4444',
          color: '#fff', padding: '1rem 2rem', borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800
        }}>
          {toast.text}
        </div>
      )}

      {/* MOBILE STICKY TOP BAR */}
      <header className={styles.mobileHeader}>
        <button className={styles.menuToggle} onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className={styles.mobileLogo}>
          <div className={styles.mobileLogoIcon}><Activity size={18} /></div>
          <span>AgriAdmin</span>
        </div>
        <div className={styles.mobileAvatar}>AD</div>
      </header>

      {/* MOBILE NAV DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR NAVIGATION (Desktop & responsive Mobile Drawer) */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon} style={{ background: '#6366f1' }}><Activity size={24} /></div>
          <span className={styles.logoText}>AgriAdmin</span>
          <button className={styles.sidebarClose} onClick={() => setMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className={styles.navMenu}>
          <button className={`${styles.navItem} ${activeTab === "dashboard" ? styles.active : ""}`} onClick={() => switchTab("dashboard")}><Activity size={20} /> Dashboard</button>
          <button className={`${styles.navItem} ${activeTab === "users" ? styles.active : ""}`} onClick={() => switchTab("users")}><Users size={20} /> Users Registry</button>
          <button className={`${styles.navItem} ${activeTab === "farmers" ? styles.active : ""}`} onClick={() => switchTab("farmers")}><Leaf size={20} /> Farmer Management</button>
          <button className={`${styles.navItem} ${activeTab === "buyers" ? styles.active : ""}`} onClick={() => switchTab("buyers")}><ShoppingBag size={20} /> Buyer Management</button>
          <button className={`${styles.navItem} ${activeTab === "delivery" ? styles.active : ""}`} onClick={() => switchTab("delivery")}><Truck size={20} /> Delivery Fleet</button>
          <button className={`${styles.navItem} ${activeTab === "products" ? styles.active : ""}`} onClick={() => switchTab("products")}><Package size={20} /> Product Moderator</button>
          <button className={`${styles.navItem} ${activeTab === "orders" ? styles.active : ""}`} onClick={() => switchTab("orders")}><TrendingUp size={20} /> Orders Monitor</button>
          <button className={`${styles.navItem} ${activeTab === "complaints" ? styles.active : ""}`} onClick={() => switchTab("complaints")}><ShieldAlert size={20} /> Complaints ({complaints.filter(c=>c.status==="PENDING").length})</button>
          <button className={`${styles.navItem} ${activeTab === "fraud" ? styles.active : ""}`} onClick={() => switchTab("fraud")}><Zap size={20} /> Fraud Logs ({fraudAlerts.filter(f=>f.status==="ACTIVE").length})</button>
          <button className={`${styles.navItem} ${activeTab === "analytics" ? styles.active : ""}`} onClick={() => switchTab("analytics")}><BarChart2 size={20} /> Analytics</button>
          <button className={`${styles.navItem} ${activeTab === "reports" ? styles.active : ""}`} onClick={() => switchTab("reports")}><Download size={20} /> Reports</button>
          <button className={`${styles.navItem} ${activeTab === "settings" ? styles.active : ""}`} onClick={() => switchTab("settings")}><Settings size={20} /> Settings</button>
        </nav>
        
        <div className={styles.logoutArea}>
          <button className={styles.navItem} onClick={() => signOut({ callbackUrl: '/' })} style={{ color: '#ef4444' }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Operations Control</h1>
            <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Real-time oversight of the Agri Marketplace ecosystem.</p>
          </div>
          
          <div className={styles.adminBadge}>
            <div className={styles.avatar}>AD</div>
            <div>
              <h4 style={{ margin: 0 }}>System Root</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6366f1', fontWeight: 800 }}>Full Operations Access</p>
            </div>
          </div>
        </header>

        {/* 1. DASHBOARD OVERVIEW TAB */}
        {activeTab === "dashboard" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {/* STATS OVERVIEW CARDS */}
            <div className={styles.statsGrid}>
              <div className={styles.adminStatCard}>
                <div className={styles.statIcon} style={{ background: '#e0e7ff', color: '#6366f1' }}><Users size={24} /></div>
                <div><p className={styles.statLabel}>Total farmers</p><h3 className={styles.statValue}>{metrics.farmers}</h3></div>
                <div className={styles.trend}><ArrowUpRight size={14} /> +4%</div>
              </div>
              <div className={styles.adminStatCard}>
                <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}><ShoppingBag size={24} /></div>
                <div><p className={styles.statLabel}>Total buyers</p><h3 className={styles.statValue}>{metrics.shopOwners}</h3></div>
                <div className={styles.trend}><ArrowUpRight size={14} /> +12%</div>
              </div>
              <div className={styles.adminStatCard}>
                <div className={styles.statIcon} style={{ background: '#fffbeb', color: '#d97706' }}><Truck size={24} /></div>
                <div><p className={styles.statLabel}>Delivery partners</p><h3 className={styles.statValue}>{metrics.agents}</h3></div>
                <div className={styles.trend}><ArrowUpRight size={14} /> +8%</div>
              </div>
              <div className={styles.adminStatCard}>
                <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#059669' }}><Package size={24} /></div>
                <div><p className={styles.statLabel}>Total products</p><h3 className={styles.statValue}>{metrics.totalHarvests}</h3></div>
                <div className={styles.trend}><ArrowUpRight size={14} /> +18%</div>
              </div>
              <div className={styles.adminStatCard}>
                <div className={styles.statIcon} style={{ background: '#f5f3ff', color: '#7c3aed' }}><TrendingUp size={24} /></div>
                <div><p className={styles.statLabel}>Total sales</p><h3 className={styles.statValue}>{metrics.totalDeals} Deals</h3></div>
              </div>
              <div className={styles.adminStatCard}>
                <div className={styles.statIcon} style={{ background: '#fff1f2', color: '#e11d48' }}><DollarSign size={24} /></div>
                <div><p className={styles.statLabel}>Revenue Volume</p><h3 className={styles.statValue}>₹{metrics.totalVolume}</h3></div>
                <div className={styles.trend}><ArrowUpRight size={14} /> +24%</div>
              </div>
            </div>

            {/* SPLIT VIEW: RECENT TRANSACTIONS & ROLE DIST */}
            <div className={styles.grid2}>
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>Real-Time Activity Stream</h2>
                  <button className={styles.refreshBtn} onClick={loadData}><RefreshCw size={18} /></button>
                </div>
                
                {metrics.negotiationsList.length === 0 ? (
                  <p style={{ fontStyle: 'italic', color: '#64748b', textAlign: 'center', padding: '2rem' }}>No recent deals placed in the marketplace yet.</p>
                ) : (
                  <div className={styles.activityList}>
                    {metrics.negotiationsList.slice(0, 5).map((act: any, i: number) => (
                      <div key={i} className={styles.activityItem}>
                        <div className={styles.activityDot} style={{ background: act.status === 'ORDER_PLACED' ? '#10b981' : '#6366f1' }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0 }}>
                            <strong>{act.buyer?.name || "Shop Owner"}</strong> placed bargain on <strong>{act.product?.name || "Crop"}</strong> at <strong>₹{act.offeredPrice}</strong>
                          </p>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Placed on {new Date(act.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`${styles.badge} ${act.status === 'ORDER_PLACED' ? styles.badgeSuccess : styles.badgeWarning}`}>{act.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeader}><h2>Distribution Share</h2></div>
                <div className={styles.roleDistribution}>
                  <div className={styles.distRow}>
                    <span className={styles.distLabel}>Farmers</span>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${metrics.totalParticipants ? (metrics.farmers / metrics.totalParticipants) * 100 : 0}%`, background: '#10b981' }} />
                    </div>
                    <span>{metrics.farmers} ({metrics.totalParticipants ? Math.round((metrics.farmers/metrics.totalParticipants)*100) : 0}%)</span>
                  </div>
                  <div className={styles.distRow}>
                    <span className={styles.distLabel}>Shop Owners</span>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${metrics.totalParticipants ? (metrics.shopOwners / metrics.totalParticipants) * 100 : 0}%`, background: '#2563eb' }} />
                    </div>
                    <span>{metrics.shopOwners} ({metrics.totalParticipants ? Math.round((metrics.shopOwners/metrics.totalParticipants)*100) : 0}%)</span>
                  </div>
                  <div className={styles.distRow}>
                    <span className={styles.distLabel}>Agents</span>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${metrics.totalParticipants ? (metrics.agents / metrics.totalParticipants) * 100 : 0}%`, background: '#f59e0b' }} />
                    </div>
                    <span>{metrics.agents} ({metrics.totalParticipants ? Math.round((metrics.agents/metrics.totalParticipants)*100) : 0}%)</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* 2. USERS REGISTRY TAB */}
        {activeTab === "users" && (
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Ecosystem Registered Users</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Registered Email</th>
                    <th>Core Role</th>
                    <th>Safety Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...metrics.farmersList, ...metrics.shopOwnersList, ...metrics.agentsList].map((user, i) => {
                    const isSuspended = !!suspendedUsers[user.id];
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 700 }}>{user.name || "Anonymous User"}</td>
                        <td>{user.email || "No Email linked"}</td>
                        <td>
                          <span className={`${styles.badge} ${
                            user.role === 'FARMER' ? styles.badgeSuccess : 
                            user.role === 'SHOP_OWNER' || user.role === 'CUSTOMER' ? styles.badgeInfo : styles.badgeWarning
                          }`}>{user.role}</span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${isSuspended ? styles.badgeDanger : styles.badgeSuccess}`}>
                            {isSuspended ? "Suspended" : "Active / Verified"}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => toggleSuspension(user.id, user.email)}
                            className={`${styles.btn} ${isSuspended ? styles.btnPrimary : styles.btnDanger}`}
                          >
                            {isSuspended ? "Re-Activate" : "Suspend"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. FARMER MANAGEMENT TAB */}
        {activeTab === "farmers" && (
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Farmer Auditing & Aadhaar Verifications</h2>
            
            {metrics.farmersList.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: '#64748b' }}>No registered farmers present currently.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Farmer Name</th>
                      <th>Email Address</th>
                      <th>Organic Status</th>
                      <th>Aadhaar Number</th>
                      <th>Approval Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.farmersList.map((f: any, i: number) => {
                      const prof = f.farmerProfile;
                      const isVerified = prof?.aadhaar;
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 700 }}>{f.name}</td>
                          <td>{f.email}</td>
                          <td>
                            <span className={`${styles.badge} ${prof?.organicStatus ? styles.badgeSuccess : styles.badgeSecondary}`}>
                              {prof?.organicStatus ? "Organic" : "Standard"}
                            </span>
                          </td>
                          <td>
                            <code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                              {prof?.aadhaar ? `Verified: ${prof.aadhaar}` : "Awaiting Audit"}
                            </code>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${isVerified ? styles.badgeSuccess : styles.badgeWarning}`}>
                              {isVerified ? "Verified" : "Pending Verification"}
                            </span>
                          </td>
                          <td>
                            {!isVerified ? (
                              <button 
                                onClick={() => handleAadhaarVerification(prof.id, f.name)}
                                className={`${styles.btn} ${styles.btnPrimary}`}
                              >
                                Verify & Approve
                              </button>
                            ) : (
                              <span style={{ color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle size={16} /> Audited
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. BUYER MANAGEMENT TAB */}
        {activeTab === "buyers" && (
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Shop Owner Procurement Audit</h2>
            
            {metrics.shopOwnersList.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: '#64748b' }}>No registered Shop Owners registered.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Shop Owner Name</th>
                      <th>Email</th>
                      <th>Account Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.shopOwnersList.map((b: any, i: number) => {
                      const isSuspended = !!suspendedUsers[b.id];
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 700 }}>{b.name}</td>
                          <td>{b.email}</td>
                          <td>
                            <span className={`${styles.badge} ${isSuspended ? styles.badgeDanger : styles.badgeSuccess}`}>
                              {isSuspended ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => toggleSuspension(b.id, b.email)}
                              className={`${styles.btn} ${isSuspended ? styles.btnPrimary : styles.btnDanger}`}
                            >
                              {isSuspended ? "Restore Operations" : "Suspend"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. DELIVERY FLEET TAB */}
        {activeTab === "delivery" && (
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Delivery Fleet Logistics & Dispatches</h2>
            
            {metrics.deliveriesList.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: '#64748b', textAlign: 'center', padding: '3rem' }}>No active transit routes scheduled right now.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Active Driver</th>
                      <th>Email</th>
                      <th>Assigned Crop Shipment</th>
                      <th>Logistics Status</th>
                      <th>Estimated Dispatch Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.deliveriesList.map((d: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700 }}>{d.deliveryBoy?.name || "Driver"}</td>
                        <td>{d.deliveryBoy?.email}</td>
                        <td>{d.order?.negotiation?.product?.name || "Cargo load"}</td>
                        <td>
                          <span className={`${styles.badge} ${
                            d.status === 'DELIVERED' ? styles.badgeSuccess : 
                            d.status === 'SHIPPED' ? styles.badgeInfo : styles.badgeWarning
                          }`}>{d.status}</span>
                        </td>
                        <td>{d.estimatedTime ? new Date(d.estimatedTime).toLocaleString() : "Not scheduled"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 6. PRODUCT MODERATOR TAB */}
        {activeTab === "products" && (
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Product Moderation Dashboard</h2>
            
            {metrics.productsList.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: '#64748b', textAlign: 'center', padding: '3rem' }}>No active crops listed in the marketplace inventory.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Crop Name</th>
                      <th>Farmer Owner</th>
                      <th>Base Price</th>
                      <th>Quantity</th>
                      <th>Category</th>
                      <th>Safety Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.productsList.map((p: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700 }}>{p.name}</td>
                        <td>{p.farmer?.user?.name || "Farmer"}</td>
                        <td>₹{p.price} / {p.unit}</td>
                        <td>{p.quantity} {p.unit}</td>
                        <td>
                          <span className={`${styles.badge} ${styles.badgeInfo}`}>{p.category}</span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleProductModeration(p.id, p.name)}
                            className={`${styles.btn} ${styles.btnDanger}`}
                          >
                            Moderate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 7. ORDERS MONITOR TAB */}
        {activeTab === "orders" && (
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Order Transaction Ledger</h2>
            
            {metrics.ordersList.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: '#64748b', textAlign: 'center', padding: '3rem' }}>No completed orders registered in the system ledger.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Order Identifier</th>
                      <th>Procuring Shop Owner</th>
                      <th>Negotiated Crop</th>
                      <th>Bargain Price</th>
                      <th>Transaction Status</th>
                      <th>Placed Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.ordersList.map((o: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 800 }}>#{o.id.substring(0, 8).toUpperCase()}</td>
                        <td>{o.user?.name || "Shop Owner"}</td>
                        <td>{o.negotiation?.product?.name || "Bulk Cargo"}</td>
                        <td style={{ fontWeight: 700, color: '#10b981' }}>₹{o.totalAmount}</td>
                        <td>
                          <span className={`${styles.badge} ${
                            o.status === 'DELIVERED' ? styles.badgeSuccess : 
                            o.status === 'SHIPPED' ? styles.badgeInfo : styles.badgeWarning
                          }`}>{o.status}</span>
                        </td>
                        <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 8. COMPLAINTS RESOLUTION TAB */}
        {activeTab === "complaints" && (
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Ecosystem Customer Support Tickets</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {complaints.map((c, i) => (
                <div key={i} className={styles.adminStatCard} style={{ borderLeft: c.status === "PENDING" ? '5px solid #d97706' : '5px solid #10b981', justifyContent: 'space-between', padding: '1.5rem 2rem', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{c.id}</span>
                      <span className={`${styles.badge} ${c.status === "PENDING" ? styles.badgeWarning : styles.badgeSuccess}`}>{c.status}</span>
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>{c.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Submitted by <strong>{c.user}</strong> • Category: <strong>{c.type}</strong> • Date: <strong>{c.date}</strong></p>
                  </div>
                  
                  {c.status === "PENDING" && (
                    <button 
                      onClick={() => handleResolveComplaint(c.id)}
                      className={`${styles.btn} ${styles.btnPrimary}`}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. FRAUD DETECTION TAB */}
        {activeTab === "fraud" && (
          <div className={styles.card}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Ecosystem Anomaly & Fraud Logs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {fraudAlerts.map((f, i) => (
                <div key={i} className={styles.adminStatCard} style={{ borderLeft: f.status === "ACTIVE" ? '5px solid #e11d48' : '5px solid #64748b', justifyContent: 'space-between', padding: '1.5rem 2rem', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{f.id}</span>
                      <span className={`${styles.badge} ${f.severity === "HIGH" ? styles.badgeDanger : f.severity === "MEDIUM" ? styles.badgeWarning : styles.badgeInfo}`}>{f.severity} Severity Anomaly</span>
                      <span className={`${styles.badge} ${f.status === "ACTIVE" ? styles.badgeDanger : styles.badgeSuccess}`}>{f.status}</span>
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <AlertTriangle size={20} color="#e11d48" /> {f.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Detected <strong>{f.date}</strong> by AI Fraud Monitor</p>
                  </div>
                  
                  {f.status === "ACTIVE" && (
                    <button 
                      onClick={() => handleDismissFraud(f.id)}
                      className={`${styles.btn} ${styles.btnSecondary}`}
                    >
                      Dismiss Alert
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. ANALYTICS CHART TAB */}
        {activeTab === "analytics" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            <div className={styles.grid2}>
              {/* CHART 1: USER GROWTH */}
              <section className={styles.card}>
                <div className={styles.cardHeader}><h2>User Growth</h2></div>
                <div className={styles.chartContainer}>
                  <div className={styles.chartBar} style={{ height: '30%' }}><span className={styles.chartBarVal}>12</span><span className={styles.chartBarLabel}>Jan</span></div>
                  <div className={styles.chartBar} style={{ height: '45%' }}><span className={styles.chartBarVal}>18</span><span className={styles.chartBarLabel}>Feb</span></div>
                  <div className={styles.chartBar} style={{ height: '60%' }}><span className={styles.chartBarVal}>24</span><span className={styles.chartBarLabel}>Mar</span></div>
                  <div className={styles.chartBar} style={{ height: '80%' }}><span className={styles.chartBarVal}>35</span><span className={styles.chartBarLabel}>Apr</span></div>
                  <div className={styles.chartBar} style={{ height: '98%' }}><span className={styles.chartBarVal}>{metrics.totalParticipants}</span><span className={styles.chartBarLabel}>May</span></div>
                </div>
                <p style={{ marginTop: '3.5rem', color: '#64748b', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }}>Active registered accounts month-over-month</p>
              </section>

              {/* CHART 2: REVENUE */}
              <section className={styles.card}>
                <div className={styles.cardHeader}><h2>Revenue Volume Analytics</h2></div>
                <div className={styles.chartContainer}>
                  <div className={styles.chartBar} style={{ height: '20%', background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)' }}><span className={styles.chartBarVal}>₹4K</span><span className={styles.chartBarLabel}>Jan</span></div>
                  <div className={styles.chartBar} style={{ height: '40%', background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)' }}><span className={styles.chartBarVal}>₹12K</span><span className={styles.chartBarLabel}>Feb</span></div>
                  <div className={styles.chartBar} style={{ height: '55%', background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)' }}><span className={styles.chartBarVal}>₹18K</span><span className={styles.chartBarLabel}>Mar</span></div>
                  <div className={styles.chartBar} style={{ height: '75%', background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)' }}><span className={styles.chartBarVal}>₹32K</span><span className={styles.chartBarLabel}>Apr</span></div>
                  <div className={styles.chartBar} style={{ height: '95%', background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)' }}><span className={styles.chartBarVal}>₹{metrics.totalVolume}</span><span className={styles.chartBarLabel}>May</span></div>
                </div>
                <p style={{ marginTop: '3.5rem', color: '#64748b', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }}>Transaction revenue volume (INR) month-over-month</p>
              </section>
            </div>

            <div className={styles.grid2}>
              {/* CHART 3: PRODUCT TRENDS */}
              <section className={styles.card}>
                <div className={styles.cardHeader}><h2>Product Listing Trends</h2></div>
                <div className={styles.chartContainer}>
                  <div className={styles.chartBar} style={{ height: '30%', background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)' }}><span className={styles.chartBarVal}>4</span><span className={styles.chartBarLabel}>Jan</span></div>
                  <div className={styles.chartBar} style={{ height: '50%', background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)' }}><span className={styles.chartBarVal}>9</span><span className={styles.chartBarLabel}>Feb</span></div>
                  <div className={styles.chartBar} style={{ height: '65%', background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)' }}><span className={styles.chartBarVal}>12</span><span className={styles.chartBarLabel}>Mar</span></div>
                  <div className={styles.chartBar} style={{ height: '80%', background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)' }}><span className={styles.chartBarVal}>15</span><span className={styles.chartBarLabel}>Apr</span></div>
                  <div className={styles.chartBar} style={{ height: '98%', background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)' }}><span className={styles.chartBarVal}>{metrics.totalHarvests}</span><span className={styles.chartBarLabel}>May</span></div>
                </div>
                <p style={{ marginTop: '3.5rem', color: '#64748b', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }}>Total unique crop listings active month-over-month</p>
              </section>

              {/* CHART 4: ORDER TRENDS */}
              <section className={styles.card}>
                <div className={styles.cardHeader}><h2>Order Quantity Trends</h2></div>
                <div className={styles.chartContainer}>
                  <div className={styles.chartBar} style={{ height: '25%', background: 'linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)' }}><span className={styles.chartBarVal}>2</span><span className={styles.chartBarLabel}>Jan</span></div>
                  <div className={styles.chartBar} style={{ height: '40%', background: 'linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)' }}><span className={styles.chartBarVal}>6</span><span className={styles.chartBarLabel}>Feb</span></div>
                  <div className={styles.chartBar} style={{ height: '55%', background: 'linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)' }}><span className={styles.chartBarVal}>10</span><span className={styles.chartBarLabel}>Mar</span></div>
                  <div className={styles.chartBar} style={{ height: '70%', background: 'linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)' }}><span className={styles.chartBarVal}>12</span><span className={styles.chartBarLabel}>Apr</span></div>
                  <div className={styles.chartBar} style={{ height: '95%', background: 'linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)' }}><span className={styles.chartBarVal}>{metrics.ordersList.length}</span><span className={styles.chartBarLabel}>May</span></div>
                </div>
                <p style={{ marginTop: '3.5rem', color: '#64748b', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }}>Total finalized orders generated month-over-month</p>
              </section>
            </div>
          </div>
        )}

        {/* 11. REPORTS EXPORT TAB */}
        {activeTab === "reports" && (
          <div className={styles.card} style={{ padding: '3.5rem', textAlign: 'center' }}>
            <Download size={64} color="#6366f1" style={{ margin: '0 auto 2rem' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Export Operational Ledger Reports</h2>
            <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
              Compile all current platform statistics, active inventories, transaction records, audit configurations, and complaints resolution metrics into a single, high-fidelity Excel-compatible CSV file.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={handleExportCSV}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ padding: '1rem 2rem', fontSize: '1rem' }}
              >
                <Download size={20} /> Export Excel / CSV Report
              </button>
            </div>
          </div>
        )}

        {/* 12. SYSTEM SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Ecosystem Operational Rules Settings</h2>
            
            <div className={styles.grid2} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>Automatic Crop Moderation</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>If enabled, new farmer crop uploads are active immediately. If disabled, they require explicit administrator approval.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <input 
                  type="checkbox" 
                  checked={systemSettings.autoModCrops}
                  onChange={(e) => setSystemSettings({ ...systemSettings, autoModCrops: e.target.checked })}
                  style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className={styles.grid2} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>Require Aadhaar Verification</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Mandate all newly registered farmers to verify their 12-digit Aadhaar number before posting bulk harvests.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <input 
                  type="checkbox" 
                  checked={systemSettings.requireAadhaar}
                  onChange={(e) => setSystemSettings({ ...systemSettings, requireAadhaar: e.target.checked })}
                  style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className={styles.grid2} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>AI Fraud Detection Sensitivity</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Determine anomaly threshold parameters for bargain attempts rate and route deviation alerts.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <select 
                  value={systemSettings.alertThreshold}
                  onChange={(e) => setSystemSettings({ ...systemSettings, alertThreshold: e.target.value })}
                  style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                >
                  <option value="LOW">Low Sensitivity</option>
                  <option value="MEDIUM">Standard Medium</option>
                  <option value="HIGH">High (Paranoid)</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => triggerToast("System settings updated successfully!")}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ width: 'fit-content', padding: '1rem 2rem' }}
            >
              Save Operational System Configuration
            </button>

            <div style={{ borderTop: '1px solid #fee2e2', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <h3 style={{ color: '#ef4444', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Danger Zone</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Once you delete your administrator account, you will lose all operations oversight, platform moderation privileges, and system registries control.</p>
              <button onClick={handleDeleteAccount} style={{ background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '0.75rem 2rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem' }}>Delete Admin Account</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
