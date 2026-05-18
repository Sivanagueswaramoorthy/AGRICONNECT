"use client";

import { useState, useEffect } from "react";
import { 
  Truck, Package, MapPin, Phone, CheckCircle, 
  Clock, Navigation, LogOut, User, Activity, Shield, Award, Edit, Save, Menu, X
} from "lucide-react";
import styles from "./page.module.css";
import { 
  getDeliveryAssignments, 
  updateDeliveryStatus, 
  respondToDeliveryRequest 
} from "@/app/actions/deliveryActions";
import { signOut, useSession } from "next-auth/react";

export default function DeliveryDashboard() {
  const [activeTab, setActiveTab] = useState("active");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Editable Vehicle Details State
  const [vehicle, setVehicle] = useState({
    type: "Refrigerated Mini Truck",
    plate: "MH-12-PQ-8874",
    capacity: "2.5 Metric Tons",
    tempControl: "Active (4°C maintained)",
    fuelEfficiency: "18 km/L",
    insurance: "Active till Nov 2026",
    health: "Excellent",
    lastMaintenance: "12 May 2026"
  });
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);

  // Session
  const { data: session } = useSession();
  const driverName = session?.user?.name || "Rajan Kumar";
  const driverEmail = session?.user?.email || "del1@agri.com";
  const agentId = (session?.user as any)?.id || "del1";

  const handleDeleteAccount = async () => {
    if (!session?.user?.email) return;
    const confirmed = window.confirm(
      "WARNING: Are you absolutely sure you want to permanently delete your account? This will wipe your profile, active cargo assignments, and all historical records from the Agri database. This cannot be undone."
    );
    if (!confirmed) return;

    setLoading(true);
    const { deleteUserAccount } = await import("@/app/actions/userActions");
    const res = await deleteUserAccount(session.user.email);
    if (res.success) {
      alert("Your account was successfully deleted. Redirecting to home...");
      signOut({ callbackUrl: "/" });
    } else {
      alert("Error deleting account: " + res.error);
      setLoading(false);
    }
  };

  async function loadData() {
    setLoading(true);
    try {
      const data = await getDeliveryAssignments(agentId);
      setAssignments(data);
    } catch (err) {
      console.error("Failed to load delivery data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleAcceptReject = async (deliveryId: string, accept: boolean) => {
    setLoading(true);
    const res = await respondToDeliveryRequest(deliveryId, accept);
    if (res.success) {
      setToast({ 
        text: accept ? "Delivery proposal accepted! Route added to queue." : "Delivery proposal declined.", 
        type: accept ? "success" : "error" 
      });
    } else {
      setToast({ text: "Action failed. Please try again.", type: "error" });
    }
    await loadData();
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusUpdate = async (deliveryId: string, newStatus: string) => {
    setLoading(true);
    const res = await updateDeliveryStatus(deliveryId, newStatus);
    if (res.success) {
      setToast({ text: `Delivery status updated to ${newStatus}!`, type: "success" });
    } else {
      setToast({ text: "Failed to update status.", type: "error" });
    }
    await loadData();
    setTimeout(() => setToast(null), 3000);
  };

  // Filter lists based on tab
  const pendingRequests = assignments.filter(a => a.status === "ASSIGNED");
  const activeRoutes = assignments.filter(a => ["ACCEPTED", "SHIPPED"].includes(a.status));
  const pastDeliveries = assignments.filter(a => a.status === "DELIVERED");

  return (
    <div className={styles.container}>
      {/* TOAST FEEDBACK */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', padding: '1rem 2rem', borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800,
          animation: 'slide-in 0.3s ease-out'
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
          <div className={styles.mobileLogoIcon} style={{ background: '#f59e0b' }}><Truck size={18} /></div>
          <span>AgriLogistics</span>
        </div>
        <div className={styles.mobileAvatar}>D</div>
      </header>

      {/* MOBILE NAV DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}><Truck size={24} /></div>
          <span className={styles.logoText}>AgriLogistics</span>
          <button className={styles.sidebarClose} onClick={() => setMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className={styles.navLinks}>
           <button 
             className={`${styles.navLink} ${activeTab === "active" ? styles.active : ""}`}
             onClick={() => switchTab("active")}
           >
             <Navigation size={22} /> Pickup Queue
           </button>
           
           <button 
             className={`${styles.navLink} ${activeTab === "history" ? styles.active : ""}`}
             onClick={() => switchTab("history")}
           >
             <Package size={22} /> Order History
           </button>
           
           <button 
             className={`${styles.navLink} ${activeTab === "vehicle" ? styles.active : ""}`}
             onClick={() => switchTab("vehicle")}
           >
             <User size={22} /> Vehicle & Profile
           </button>
        </nav>
        
        <div className={styles.logoutArea}>
          <button className={styles.navLink} onClick={() => signOut({ callbackUrl: '/' })} style={{ color: '#ef4444' }}>
            <LogOut size={22} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              {activeTab === "active" && "Pickup Queue"}
              {activeTab === "history" && "Order History"}
              {activeTab === "vehicle" && "Vehicle & Driver Profile"}
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
              {activeTab === "active" && "Manage pickup proposals and active transport routes."}
              {activeTab === "history" && "View all completed cargo logistics."}
              {activeTab === "vehicle" && "View driver credentials and manage vehicle capacity parameters."}
            </p>
          </div>
          
          <div className={styles.profileBadge}>
            <div className={styles.avatar}>{driverName.substring(0, 2).toUpperCase()}</div>
            <div>
              <h4 style={{ margin: 0 }}>{driverName}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#f59e0b', fontWeight: 800 }}>Route Specialist</p>
            </div>
          </div>
        </header>

        {/* ACTIVE ROUTES TAB */}
        {activeTab === "active" && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* STATS OVERVIEW */}
            <div className={styles.statsGrid}>
              <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 700 }}>Pending Proposls</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', color: '#f59e0b' }}>{pendingRequests.length}</div>
              </div>
              <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 700 }}>Active Shipments</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', color: '#2563eb' }}>{activeRoutes.length}</div>
              </div>
              <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 700 }}>Driver Performance</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', color: '#10b981' }}>98.7% <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>on-time</span></div>
              </div>
            </div>

            {/* SECTION: PENDING ACCEPTANCE REQUESTS */}
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={24} color="#f59e0b" /> Incoming Dispatch Requests
              </h2>
              
              {pendingRequests.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', margin: 0, fontStyle: 'italic' }}>No new dispatch requests waiting for acceptance.</p>
                </div>
              ) : (
                <div className={styles.assignmentGrid}>
                  {pendingRequests.map((a, i) => {
                    const neg = a.order?.negotiation;
                    const crop = neg?.product;
                    const farmer = neg?.farmer;
                    const buyer = a.order?.user;

                    return (
                      <article key={i} className={styles.routeCard} style={{ borderLeft: '5px solid #f59e0b' }}>
                        <div className={styles.routeHeader}>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                             <div className={styles.cargoPreview}>
                               {crop?.image ? (
                                 <img src={crop.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                               ) : (
                                 <Package size={24} color="#94a3b8" />
                               )}
                             </div>
                             <div>
                               <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{crop?.name || "Crop"}</h3>
                               <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{neg?.offeredQuantity} units • Total Val: ₹{a.order?.totalAmount}</p>
                             </div>
                          </div>
                          <span style={{ padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, background: '#fffbeb', color: '#d97706' }}>
                            Awaiting Accept
                          </span>
                        </div>

                        <div className={styles.locations} style={{ margin: '1.5rem 0' }}>
                           <div className={styles.locItem}>
                             <div className={styles.locDot} style={{ background: '#10b981' }} />
                             <div style={{ flex: 1 }}>
                               <p className={styles.locLabel}>PICKUP FROM (FARMER)</p>
                               <p className={styles.locValue} style={{ fontWeight: 700 }}>{farmer?.user?.name || "Farmer"}</p>
                               <p className={styles.locValue} style={{ fontSize: '0.8rem', color: '#64748b' }}>{farmer?.address || "Address N/A"}</p>
                             </div>
                             {farmer?.mobileNumber && (
                               <a href={`tel:${farmer.mobileNumber}`} className={styles.callBtn}><Phone size={18} /></a>
                             )}
                           </div>
                           <div className={styles.connector} />
                           <div className={styles.locItem}>
                             <div className={styles.locDot} style={{ background: '#2563eb' }} />
                             <div style={{ flex: 1 }}>
                               <p className={styles.locLabel}>DELIVER TO (SHOP OWNER)</p>
                               <p className={styles.locValue} style={{ fontWeight: 700 }}>{buyer?.name || "Shop Owner"}</p>
                               <p className={styles.locValue} style={{ fontSize: '0.8rem', color: '#64748b' }}>{buyer?.email || "Shop Address"}</p>
                             </div>
                           </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                          <button 
                            onClick={() => handleAcceptReject(a.id, true)}
                            className={styles.primaryBtn} 
                            style={{ flex: 1, padding: '0.75rem 1.5rem' }}
                          >
                            Accept Dispatch
                          </button>
                          <button 
                            onClick={() => handleAcceptReject(a.id, false)}
                            className={styles.secondaryBtn} 
                            style={{ flex: 1, padding: '0.75rem 1.5rem', borderColor: '#ef4444', color: '#ef4444' }}
                          >
                            Decline
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION: ACTIVE TRANSPORT ROUTES */}
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Navigation size={24} color="#2563eb" /> On-Going Shipments
              </h2>
              
              {activeRoutes.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', margin: 0, fontStyle: 'italic' }}>No active route scheduled right now. Accept dispatch requests to start routes.</p>
                </div>
              ) : (
                <div className={styles.assignmentGrid}>
                  {activeRoutes.map((a, i) => {
                    const neg = a.order?.negotiation;
                    const crop = neg?.product;
                    const farmer = neg?.farmer;
                    const buyer = a.order?.user;

                    return (
                      <article key={i} className={styles.routeCard} style={{ borderLeft: '5px solid #2563eb' }}>
                        <div className={styles.routeHeader}>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                             <div className={styles.cargoPreview}>
                               {crop?.image ? (
                                 <img src={crop.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                               ) : (
                                 <Package size={24} color="#94a3b8" />
                               )}
                             </div>
                             <div>
                               <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{crop?.name || "Crop"}</h3>
                               <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{neg?.offeredQuantity} units • Total Val: ₹{a.order?.totalAmount}</p>
                             </div>
                          </div>
                          <span style={{ 
                            padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, 
                            background: a.status === 'SHIPPED' ? '#eff6ff' : '#ecfdf5', 
                            color: a.status === 'SHIPPED' ? '#2563eb' : '#10b981' 
                          }}>
                            {a.status === "ACCEPTED" ? "Transport Accepted" : "Picked Up (Shipped)"}
                          </span>
                        </div>

                        <div className={styles.locations} style={{ margin: '1.5rem 0' }}>
                           <div className={styles.locItem}>
                             <div className={styles.locDot} style={{ background: '#10b981' }} />
                             <div style={{ flex: 1 }}>
                               <p className={styles.locLabel}>PICKUP FROM (FARMER)</p>
                               <p className={styles.locValue} style={{ fontWeight: 700 }}>{farmer?.user?.name || "Farmer"}</p>
                               <p className={styles.locValue} style={{ fontSize: '0.8rem', color: '#64748b' }}>{farmer?.address || "Address N/A"}</p>
                             </div>
                             {farmer?.mobileNumber && (
                               <a href={`tel:${farmer.mobileNumber}`} className={styles.callBtn}><Phone size={18} /></a>
                             )}
                           </div>
                           <div className={styles.connector} />
                           <div className={styles.locItem}>
                             <div className={styles.locDot} style={{ background: '#2563eb' }} />
                             <div style={{ flex: 1 }}>
                               <p className={styles.locLabel}>DELIVER TO (SHOP OWNER)</p>
                               <p className={styles.locValue} style={{ fontWeight: 700 }}>{buyer?.name || "Shop Owner"}</p>
                               <p className={styles.locValue} style={{ fontSize: '0.8rem', color: '#64748b' }}>{buyer?.email || "Shop Address"}</p>
                             </div>
                           </div>
                        </div>

                        <div className={styles.actions} style={{ marginTop: '1.5rem' }}>
                           {a.status === 'ACCEPTED' && (
                             <button className={styles.primaryBtn} style={{ width: '100%' }} onClick={() => handleStatusUpdate(a.id, 'SHIPPED')}>
                               Mark as Picked Up
                             </button>
                           )}
                           {a.status === 'SHIPPED' && (
                             <button className={styles.primaryBtn} style={{ background: '#10b981', width: '100%' }} onClick={() => handleStatusUpdate(a.id, 'DELIVERED')}>
                               Mark as Delivered
                             </button>
                           )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ORDER HISTORY TAB */}
        {activeTab === "history" && (
          <div className="animate-fade-in">
            {pastDeliveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '40px', border: '1px solid #e2e8f0' }}>
                 <Package size={60} color="#cbd5e1" style={{ margin: '0 auto 2rem' }} />
                 <h2 style={{ fontWeight: 800 }}>No past shipments found</h2>
                 <p style={{ color: '#64748b' }}>Completed logs of cargo dispatches will show up here.</p>
              </div>
            ) : (
              <div className={styles.assignmentGrid}>
                {pastDeliveries.map((a, i) => {
                  const neg = a.order?.negotiation;
                  const crop = neg?.product;
                  const farmer = neg?.farmer;
                  const buyer = a.order?.user;

                  return (
                    <article key={i} className={styles.routeCard} style={{ borderLeft: '5px solid #10b981', opacity: 0.85 }}>
                      <div className={styles.routeHeader}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                           <div className={styles.cargoPreview}>
                             {crop?.image ? (
                               <img src={crop.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             ) : (
                               <Package size={24} color="#94a3b8" />
                             )}
                           </div>
                           <div>
                             <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{crop?.name || "Crop"}</h3>
                             <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{neg?.offeredQuantity} units • ₹{a.order?.totalAmount}</p>
                           </div>
                        </div>
                        <span style={{ padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, background: '#ecfdf5', color: '#10b981' }}>
                          Delivered
                        </span>
                      </div>

                      <div className={styles.locations} style={{ margin: '1.5rem 0' }}>
                         <div className={styles.locItem}>
                           <div className={styles.locDot} style={{ background: '#10b981' }} />
                           <div style={{ flex: 1 }}>
                             <p className={styles.locLabel}>PICKUP FROM (FARMER)</p>
                             <p className={styles.locValue} style={{ fontWeight: 700 }}>{farmer?.user?.name || "Farmer"}</p>
                             <p className={styles.locValue} style={{ fontSize: '0.8rem', color: '#64748b' }}>{farmer?.address || "Address N/A"}</p>
                           </div>
                         </div>
                         <div className={styles.connector} />
                         <div className={styles.locItem}>
                           <div className={styles.locDot} style={{ background: '#2563eb' }} />
                           <div style={{ flex: 1 }}>
                             <p className={styles.locLabel}>DELIVERED TO (SHOP)</p>
                             <p className={styles.locValue} style={{ fontWeight: 700 }}>{buyer?.name || "Shop Owner"}</p>
                             <p className={styles.locValue} style={{ fontSize: '0.8rem', color: '#64748b' }}>{buyer?.email || "Shop Address"}</p>
                           </div>
                         </div>
                      </div>

                      <div style={{ color: '#10b981', fontWeight: 800, textAlign: 'center', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f0fdf4', padding: '0.75rem', borderRadius: '12px' }}>
                        <CheckCircle size={20} /> Delivered Successfully
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VEHICLE & PROFILE DETAILS TAB */}
        {activeTab === "vehicle" && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* LOGISTICS PERFORMANCE CENTER */}
            <div className={styles.routeCard} style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', height: 'fit-content' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Logistics Performance Center</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Real-time driver operational analytics and efficiency tracking.</p>
              </div>

              {/* Today's Delivery Summary */}
              <div>
                <h4 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>Today's Delivery Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Deliveries Completed</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>18</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Pending Deliveries</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>5</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Success Rate</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>97.8%</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Distance Today</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>126 km</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h4 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>Performance Metrics</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>On-Time Delivery Score</span>
                    <strong style={{ color: '#0f172a' }}>4.9/5</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Average Delivery Time</span>
                    <strong style={{ color: '#0f172a' }}>22 mins</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Customer Satisfaction</span>
                    <strong style={{ color: '#10b981' }}>98%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Route Efficiency</span>
                    <strong style={{ color: '#2563eb' }}>High</strong>
                  </div>
                </div>
              </div>

              {/* Live Status */}
              <div>
                <h4 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>Live Status</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <span>🟢</span>
                    <strong style={{ color: '#10b981' }}>Available for Orders</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <span>📍</span>
                    <span style={{ color: '#64748b' }}>Current Hub:</span>
                    <strong style={{ color: '#0f172a' }}>Chennai Central Zone</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <span>⏰</span>
                    <span style={{ color: '#64748b' }}>Shift:</span>
                    <strong style={{ color: '#0f172a' }}>8:00 AM – 6:00 PM</strong>
                  </div>
                </div>
              </div>

              {/* Button */}
              <button className={styles.primaryBtn} style={{ padding: '0.75rem', width: '100%', justifyContent: 'center' }}>
                View Full Analytics →
              </button>

              {/* Danger Zone */}
              <div style={{ borderTop: '1px solid #fee2e2', paddingTop: '1.5rem', marginTop: '1rem' }}>
                <h4 style={{ color: '#ef4444', fontWeight: 800, margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Danger Zone</h4>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: '1.4' }}>Once you delete your account, you will be permanently removed from all pending deliveries and route dispatch assignments.</p>
                <button className={styles.secondaryBtn} onClick={handleDeleteAccount} style={{ background: '#fef2f2', color: '#ef4444', borderColor: '#fecaca', width: 'auto', padding: '0.6rem 1.5rem', fontSize: '0.85rem', fontWeight: 700 }}>Delete Account</button>
              </div>
            </div>

            {/* VEHICLE DETAILS CARD */}
            <div className={styles.routeCard} style={{ padding: '2.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={24} color="#2563eb" /> Fleet & Compliance Dashboard
                </h3>
                <button 
                  onClick={() => setIsEditingVehicle(!isEditingVehicle)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 800 }}
                >
                  {isEditingVehicle ? (
                    <><Save size={18} /> Done</>
                  ) : (
                    <><Edit size={18} /> Update Fleet Details</>
                  )}
                </button>
              </div>

              {isEditingVehicle ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>Vehicle Type</label>
                    <input 
                      type="text" value={vehicle.type} 
                      onChange={(e) => setVehicle({ ...vehicle, type: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>Plate Number</label>
                    <input 
                      type="text" value={vehicle.plate} 
                      onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>Payload Capacity</label>
                    <input 
                      type="text" value={vehicle.capacity} 
                      onChange={(e) => setVehicle({ ...vehicle, capacity: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>Cold Storage Status</label>
                    <input 
                      type="text" value={vehicle.tempControl} 
                      onChange={(e) => setVehicle({ ...vehicle, tempControl: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>Fuel Efficiency</label>
                    <input 
                      type="text" value={vehicle.fuelEfficiency} 
                      onChange={(e) => setVehicle({ ...vehicle, fuelEfficiency: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>Insurance Status</label>
                    <input 
                      type="text" value={vehicle.insurance} 
                      onChange={(e) => setVehicle({ ...vehicle, insurance: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>Vehicle Health</label>
                    <input 
                      type="text" value={vehicle.health} 
                      onChange={(e) => setVehicle({ ...vehicle, health: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>Last Maintenance</label>
                    <input 
                      type="text" value={vehicle.lastMaintenance} 
                      onChange={(e) => setVehicle({ ...vehicle, lastMaintenance: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Vehicle Type</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{vehicle.type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Plate Number</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{vehicle.plate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Payload Capacity</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{vehicle.capacity}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Cold Storage Status</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{vehicle.tempControl}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Fuel Efficiency</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{vehicle.fuelEfficiency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Insurance Status</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{vehicle.insurance}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Vehicle Health</span>
                    <span style={{ fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={16} /> {vehicle.health}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Last Maintenance</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{vehicle.lastMaintenance}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
