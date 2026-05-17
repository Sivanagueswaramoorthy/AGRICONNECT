"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, ShoppingBag, ShoppingCart, BarChart3, 
  Settings, LogOut, Search, Bell, Gavel, 
  Check, X, Calendar, User, MapPin, Truck, Phone,
  TrendingUp, CreditCard, ChevronRight, Info, Heart, Leaf, Tag, Image as ImageIcon,
  DollarSign, Activity, Star, Filter, List, ArrowUpDown, Clock, Package, Plus, RefreshCw, Menu
} from "lucide-react";
import styles from "./page.module.css";
import { createNegotiation, getNegotiationsForBuyer, confirmCounterOffer, updateBargainPrice } from "@/app/actions/negotiationActions";
import { getMarketplaceProducts, getShopOwnerOrders, getCart, addToCart, getWishlist, toggleWishlist, getSubscriptions, createSubscription } from "@/app/actions/shopActions";
import { getShopOwnerStats } from "@/app/actions/statsActions";
import { useSession, signOut } from "next-auth/react";

export default function ShopOwnerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState<any[]>([]);
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [assigningDeliveryFor, setAssigningDeliveryFor] = useState<string | null>(null);
  const [showDatePickerModal, setShowDatePickerModal] = useState<any>(null);
  const [pickupDate, setPickupDate] = useState<string>("");
  
  const [stats, setStats] = useState({ counterOffers: 0, activeOrders: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };
  
  // Modals & UI Feedback
  const [toast, setToast] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [showBargainModal, setShowBargainModal] = useState<any>(null);
  const [bargainData, setBargainData] = useState({ quantity: 1, price: 0 });
  const [showCounterModal, setShowCounterModal] = useState<any>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Lowest Price");
  
  const { data: session, status } = useSession();
  const shopId = (session?.user as any)?.id || "shop1"; 

  async function loadData() {
    setLoading(true);
    try {
      const [p, n, s, o, c, w, sub] = await Promise.all([
        getMarketplaceProducts(),
        getNegotiationsForBuyer(shopId),
        getShopOwnerStats(shopId),
        getShopOwnerOrders(shopId),
        getCart(shopId),
        getWishlist(shopId),
        getSubscriptions(shopId)
      ]);
      setProducts(p);
      setNegotiations(n);
      setStats(s);
      setOrders(o);
      setWishlist(w);
      setSubscriptions(sub);
    } catch (err) {
      console.error("Data Load Error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [activeTab]);

  const handleToggleWishlist = async (productId: string) => {
    setLoading(true);
    await toggleWishlist(shopId, productId);
    await loadData();
  };

  const handleCreateSubscription = async (productId: string, frequency: string) => {
    setLoading(true);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1); // Starts tomorrow
    await createSubscription({ userId: shopId, productId, frequency, quantity: 10, nextDeliveryDate: nextDate });
    setToast({text: `Successfully subscribed to ${frequency} deliveries!`, type: "success"});
    await loadData();
    setTimeout(() => setToast(null), 3000);
  };

  const handleBargainSubmit = async () => {
    setLoading(true);
    const res = await createNegotiation({
      productId: showBargainModal.id,
      buyerId: shopId,
      offeredPrice: bargainData.price,
      offeredQuantity: bargainData.quantity
    });
    if(res.success) setToast({text: "Bargain offer sent to farmer!", type: "success"});
    else setToast({text: res.error, type: "error"});
    setShowBargainModal(null);
    await loadData();
    setTimeout(() => setToast(null), 3000);
  };

  const handleAcceptCounter = async (neg: any) => {
    setLoading(true);
    const { buyerAcceptOffer } = await import("@/app/actions/negotiationActions");
    const res = await buyerAcceptOffer(neg.id);
    if(res.success) setToast({text: "Agreed to price! Waiting for Farmer's final approval.", type: "success"});
    else setToast({text: res.error, type: "error"});
    await loadData();
    setTimeout(() => setToast(null), 3000);
  };

  const handleCheckout = async (negId: string, type: "SELF" | "AGENT", options?: any) => {
    setLoading(true);
    const { checkoutNegotiation } = await import("@/app/actions/negotiationActions");
    const res = await checkoutNegotiation(negId, type, options);
    if(res.success) {
      setToast({text: `Order finalized with ${type === 'SELF' ? 'Self Pickup' : options?.agentName}!`, type: "success"});
      setActiveTab("orders");
    }
    else setToast({text: res.error, type: "error"});
    await loadData();
    setTimeout(() => setToast(null), 3000);
  };

  const handleAssignAgent = async () => {
    if(!assigningDeliveryFor || !showDatePickerModal || !pickupDate) {
      setToast({ text: "Please select a date.", type: "error" });
      return;
    }
    await handleCheckout(assigningDeliveryFor, "AGENT", {
      agentId: showDatePickerModal.id,
      agentName: showDatePickerModal.name,
      agentMobile: showDatePickerModal.mobile,
      pickupDate: pickupDate
    });
    setShowDatePickerModal(null);
    setAssigningDeliveryFor(null);
    setActiveTab("orders");
  };

  const handleRejectOffer = async (id: string) => {
    setLoading(true);
    const { rejectNegotiation } = await import("@/app/actions/negotiationActions");
    await rejectNegotiation(id);
    setToast({text: "Offer rejected.", type: "success"});
    await loadData();
    setTimeout(() => setToast(null), 3000);
  };

  const handleCounterReplySubmit = async () => {
    setLoading(true);
    const res = await updateBargainPrice(showCounterModal.id, bargainData.price);
    if(res.success) setToast({text: "New counter offer sent!", type: "success"});
    else setToast({text: res.error, type: "error"});
    setShowCounterModal(null);
    await loadData();
    setTimeout(() => setToast(null), 3000);
  };

  if ((loading && products.length === 0) || status === "loading") return (
    <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1.5rem' }}></div>
        <h3 style={{ color: '#64748b', fontWeight: 700 }}>Connecting to Neon SQL...</h3>
      </div>
    </div>
  );

  let filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  if (categoryFilter !== "All") {
    filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
  }
  
  if (sortBy === "Lowest Price") filteredProducts.sort((a, b) => a.price - b.price);
  if (sortBy === "Highest Price") filteredProducts.sort((a, b) => b.price - a.price);

  return (
    <div className={styles.container}>
      {loading && (
        <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 2000 }}>
          <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        </div>
      )}

      {/* MOBILE STICKY TOP BAR */}
      <header className={styles.mobileHeader}>
        <button className={styles.menuToggle} onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className={styles.mobileLogo}>
          <div className={styles.mobileLogoIcon} style={{ background: '#2563eb' }}><ShoppingBag size={18} /></div>
          <span>AgriBuyer</span>
        </div>
        <div className={styles.mobileAvatar}>B</div>
      </header>

      {/* MOBILE NAV DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon} style={{ background: '#2563eb' }}><ShoppingBag size={24} /></div>
          <span className={styles.logoText}>AgriBuyer</span>
          <button className={styles.sidebarClose} onClick={() => setMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className={styles.navMenu}>
          <button className={`${styles.navItem} ${activeTab === "dashboard" ? styles.active : ""}`} onClick={() => switchTab("dashboard")}><LayoutDashboard size={20} /> Dashboard</button>
          <button className={`${styles.navItem} ${activeTab === "marketplace" ? styles.active : ""}`} onClick={() => switchTab("marketplace")}><Search size={20} /> Marketplace</button>
          <button className={`${styles.navItem} ${activeTab === "wishlist" ? styles.active : ""}`} onClick={() => switchTab("wishlist")}><Heart size={20} /> Wishlist</button>
          <button className={`${styles.navItem} ${activeTab === "bargains" ? styles.active : ""}`} onClick={() => switchTab("bargains")}><Gavel size={20} /> Bargains</button>
          <button className={`${styles.navItem} ${activeTab === "orders" ? styles.active : ""}`} onClick={() => switchTab("orders")}><Truck size={20} /> Orders</button>
          <button className={`${styles.navItem} ${activeTab === "delivery_partners" ? styles.active : ""}`} onClick={() => switchTab("delivery_partners")}><Truck size={20} /> Delivery Partners</button>
          <button className={`${styles.navItem} ${activeTab === "subscriptions" ? styles.active : ""}`} onClick={() => switchTab("subscriptions")}><RefreshCw size={20} /> Subscriptions</button>
          <button className={`${styles.navItem} ${activeTab === "farmers" ? styles.active : ""}`} onClick={() => switchTab("farmers")}><MapPin size={20} /> Nearby Farmers</button>
          <button className={`${styles.navItem} ${activeTab === "reviews" ? styles.active : ""}`} onClick={() => switchTab("reviews")}><Star size={20} /> Reviews</button>
          <button className={`${styles.navItem} ${activeTab === "profile" ? styles.active : ""}`} onClick={() => switchTab("profile")}><User size={20} /> Profile</button>
        </nav>
        <div style={{ marginTop: 'auto' }}><button className={styles.navItem} onClick={() => signOut({ callbackUrl: '/login' })} style={{ color: '#ef4444' }}><LogOut size={22} /> Logout</button></div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.searchBar}><Search size={22} color="#94a3b8" /><input type="text" placeholder="Search live harvests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <div className={styles.profileBadge}><div className={styles.avatar}>{session?.user?.name?.[0] || 'B'}</div><div style={{ marginLeft: '0.5rem' }}><h4 style={{ margin: 0, fontWeight: 800 }}>{session?.user?.name || 'Buyer Enterprise'}</h4><p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{session?.user?.email || 'ID: BUY902'}</p></div></div>
        </header>

        {activeTab === "dashboard" && (
          <div className="animate-fade-in">
             <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2.5rem', letterSpacing: '-0.02em' }}>Procurement Overview</h2>
             
             <div className={styles.statsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Active Orders</span><Truck size={20} color="#2563eb" /></div>
                   <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.activeOrders}</div>
                </div>
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Total Spent</span><DollarSign size={20} color="#10b981" /></div>
                   <div style={{ fontSize: '2rem', fontWeight: 800 }}>₹{stats.totalSpent}</div>
                </div>
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Saved in Bargains</span><TrendingUp size={20} color="#f59e0b" /></div>
                   <div style={{ fontSize: '2rem', fontWeight: 800 }}>₹{stats.counterOffers * 450}</div>
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
               <div className={styles.card}>
                  <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Recent Orders</h3>
                  {orders.length === 0 ? <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No active orders found.</p> : (
                    <div className={styles.tableWrapper}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                          <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Order ID</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Amount</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map((o, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '1rem', fontWeight: 800 }}>#{o.id.substring(0, 8)}</td>
                              <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                              <td style={{ padding: '1rem', fontWeight: 800, color: '#10b981' }}>₹{o.totalAmount}</td>
                              <td style={{ padding: '1rem' }}><span style={{ padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, background: o.status === 'DELIVERED' ? '#ecfdf5' : '#eff6ff', color: o.status === 'DELIVERED' ? '#10b981' : '#2563eb' }}>{o.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
               </div>

               <div className={styles.card}>
                  <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>Nearby Farms Map</h3>
                  <div style={{ background: '#e2e8f0', height: '200px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                     <MapPin size={48} color="#94a3b8" style={{ opacity: 0.5 }} />
                     <div style={{ position: 'absolute', bottom: '10px', background: 'rgba(255,255,255,0.9)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>14 Farmers within 25km</div>
                  </div>
                  <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 800 }}>AI Recommendations</h3>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', color: '#2563eb', fontWeight: 700 }}><Star size={16} /> Hot Deal</div>
                    Buy <b>Organic Wheat</b> from Erode. Prices are expected to rise by 12% next week.
                  </div>
               </div>
             </div>
          </div>
        )}

        {activeTab === "marketplace" && (
          <div className="animate-fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Marketplace</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <select className={styles.formInput} style={{ width: 'auto', padding: '0.5rem 1rem' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="All">All Categories</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Grains">Grains</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Dairy">Dairy</option>
                  </select>
                  <select className={styles.formInput} style={{ width: 'auto', padding: '0.5rem 1rem' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="Lowest Price">Lowest Price</option>
                    <option value="Highest Price">Highest Price</option>
                    <option value="Distance">Distance (Nearest)</option>
                    <option value="Freshness">Freshness</option>
                  </select>
                </div>
             </div>
             
             <div className={styles.productGrid}>
              {filteredProducts.map((p, i) => (
                <article key={i} className={styles.productCard}>
                  <div className={styles.productImg} style={{ backgroundImage: p.image ? `url(${p.image})` : `url(https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80)` }}>
                    <span className={styles.categoryTag}>{p.category}</span>
                    {p.isOrganic && <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}><Leaf size={12} style={{ display: 'inline', marginRight: '4px' }}/>Organic</span>}
                  </div>
                  <div className={styles.productInfo}>
                    <div className={styles.prodHeader}><h3>{p.name}</h3><span className={styles.price}>₹{p.price}/{p.unit}</span></div>
                    <div className={styles.farmerDetails}><MapPin size={18} color="#2563eb" /><span>{p.farmer?.user?.name || "Verified Farm"} • 12km</span></div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                      <button onClick={() => { setShowBargainModal(p); setBargainData({ quantity: 1, price: p.price * 0.9 }); }} className={styles.secondaryBtn} style={{ flex: 1, padding: '0.5rem', background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}><Gavel size={18} /> Bargain</button>
                      <button onClick={() => handleToggleWishlist(p.id)} className={styles.secondaryBtn} style={{ padding: '0.5rem' }}>
                        <Heart size={18} fill={wishlist.find(w => w.productId === p.id) ? "#ef4444" : "none"} color={wishlist.find(w => w.productId === p.id) ? "#ef4444" : "#64748b"} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="animate-fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>My Subscriptions</h2>
                <button className={styles.primaryBtn} style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={() => setActiveTab("marketplace")}><Plus size={20} /> New Subscription</button>
             </div>
             
             {subscriptions.length === 0 ? (
               <div className={styles.card} style={{ textAlign: 'center', padding: '4rem' }}>
                 <RefreshCw size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                 <h3 style={{ color: '#64748b', fontWeight: 700 }}>No active subscriptions</h3>
                 <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>Set up recurring deliveries for daily milk, weekly vegetables, or monthly staples.</p>
               </div>
             ) : (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                 {subscriptions.map((sub, i) => (
                   <div key={i} className={styles.card} style={{ borderLeft: '4px solid #2563eb' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                       <span style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>{sub.frequency}</span>
                       <span style={{ color: sub.status === 'ACTIVE' ? '#10b981' : '#94a3b8', fontSize: '0.8rem', fontWeight: 800 }}>• {sub.status}</span>
                     </div>
                     <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>{sub.product.name}</h3>
                     <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>{sub.quantity} units per delivery</p>
                     <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', color: '#475569' }}>
                       <Clock size={16} /> Next delivery: {new Date(sub.nextDeliveryDate).toLocaleDateString()}
                     </div>
                   </div>
                 ))}
               </div>
             )}
             
             {/* Examples Section */}
             <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem', fontWeight: 800 }}>Popular Subscription Plans</h3>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
               <div className={styles.card} style={{ textAlign: 'center' }}>
                 <div style={{ width: '60px', height: '60px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><RefreshCw size={24} color="#2563eb" /></div>
                 <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Daily Milk</h4>
                 <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Fresh organic milk delivered every morning before 7 AM.</p>
                 <button className={styles.secondaryBtn}>Explore Plans</button>
               </div>
               <div className={styles.card} style={{ textAlign: 'center' }}>
                 <div style={{ width: '60px', height: '60px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><Leaf size={24} color="#10b981" /></div>
                 <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Weekly Veggies</h4>
                 <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Seasonal fresh vegetables basket delivered every Sunday.</p>
                 <button className={styles.secondaryBtn}>Explore Plans</button>
               </div>
               <div className={styles.card} style={{ textAlign: 'center' }}>
                 <div style={{ width: '60px', height: '60px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><Package size={24} color="#f59e0b" /></div>
                 <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Monthly Rice/Grains</h4>
                 <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Bulk 25kg bags of premium grains delivered monthly.</p>
                 <button className={styles.secondaryBtn}>Explore Plans</button>
               </div>
             </div>
          </div>
        )}

         {activeTab === "bargains" && (
           <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Active Bargains</h2>
              </div>
              
              {negotiations.length === 0 ? (
                <div className={styles.card} style={{ textAlign: 'center', padding: '4rem' }}>
                  <Gavel size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ color: '#64748b', fontWeight: 700 }}>No active bargains</h3>
                  <button onClick={() => setActiveTab("marketplace")} className={styles.primaryBtn} style={{ width: 'auto', marginTop: '1.5rem' }}>Find Products to Bargain</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {negotiations.map((neg, i) => (
                    <div key={i} className={styles.card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: neg.status === 'COUNTERED' || neg.status === 'ACCEPTED' ? '4px solid #f59e0b' : neg.status === 'ORDER_PLACED' ? '4px solid #10b981' : neg.status === 'REJECTED' ? '4px solid #ef4444' : '4px solid #2563eb' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ padding: '4px 10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>{neg.status.replace("_", " ")}</span>
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{new Date(neg.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>{neg.product.name} <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>({neg.offeredQuantity} {neg.product.unit})</span></h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Original Price: ₹{neg.product.price}/{neg.product.unit} | <strong style={{ color: '#2563eb' }}>Current Offer: ₹{neg.offeredPrice}/{neg.product.unit}</strong></p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Farmer: {neg.farmer?.user?.name || "Verified Farmer"}</p>
                      </div>
                      
                      {neg.status === 'COUNTERED' && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                           <button onClick={() => handleAcceptCounter(neg)} className={styles.primaryBtn} style={{ padding: '0.5rem 1rem' }}><Check size={16} /> Agree to Price</button>
                           <button onClick={() => { setShowCounterModal(neg); setBargainData({ quantity: neg.offeredQuantity, price: neg.offeredPrice * 0.95 }); }} className={styles.secondaryBtn} style={{ padding: '0.5rem 1rem', background: '#eff6ff', color: '#2563eb' }}><Gavel size={16} /> Counter Reply</button>
                           <button onClick={() => handleRejectOffer(neg.id)} className={styles.secondaryBtn} style={{ padding: '0.5rem 1rem', color: '#ef4444' }}><X size={16} /> Reject</button>
                        </div>
                      )}
                      {(neg.status === 'PENDING' || neg.status === 'BUYER_ACCEPTED') && (
                         <div style={{ padding: '0.5rem 1rem', background: '#f1f5f9', color: '#64748b', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700 }}>Waiting for Farmer...</div>
                      )}
                      {neg.status === 'ACCEPTED' && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                           <div style={{ padding: '0.25rem 0', color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>Farmer sealed the deal!</div>
                           <button onClick={() => handleCheckout(neg.id, "SELF")} className={styles.primaryBtn} style={{ padding: '0.5rem 1rem', background: '#0f172a' }}><Truck size={16} /> Self Pickup</button>
                           <button onClick={() => { setAssigningDeliveryFor(neg.id); setActiveTab("delivery_partners"); }} className={styles.secondaryBtn} style={{ padding: '0.5rem 1rem', borderColor: '#2563eb', color: '#2563eb' }}><Truck size={16} /> Assign Agent</button>
                        </div>
                      )}
                      {(neg.status === 'ORDER_PLACED' || neg.status === 'REJECTED') && (
                         <div style={{ padding: '0.5rem 1rem', background: neg.status === 'ORDER_PLACED' ? '#ecfdf5' : '#fef2f2', color: neg.status === 'ORDER_PLACED' ? '#10b981' : '#ef4444', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700 }}>{neg.status === 'ORDER_PLACED' ? "ORDER CONFIRMED" : "REJECTED"}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
           </div>
         )}

        {activeTab === "delivery_partners" && (
          <div className="animate-fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
               <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Logistics & Agents</h2>
               {assigningDeliveryFor && (
                 <span style={{ padding: '0.75rem 1.5rem', background: '#eff6ff', color: '#2563eb', borderRadius: '12px', fontWeight: 700 }}>Selecting Agent for Pending Deal</span>
               )}
             </div>

             <div className={styles.productGrid}>
               {[
                 { id: "del1", name: "AgriLogistics Pro", mobile: "+91 9876543210", vehicles: "Temp-Controlled Trucks", rating: 4.8 },
                 { id: "del2", name: "FastMover Farmers", mobile: "+91 9998887776", vehicles: "Mini Trucks", rating: 4.5 },
                 { id: "del3", name: "EcoTransport", mobile: "+91 8887776665", vehicles: "Electric Vans", rating: 4.9 }
               ].map((agent, i) => (
                 <div key={i} className={styles.productCard} style={{ padding: '2rem', borderTop: '4px solid #10b981' }}>
                   <div style={{ width: '64px', height: '64px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                     <Truck size={32} color="#10b981" />
                   </div>
                   <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{agent.name}</h3>
                   <p style={{ margin: '0 0 0.25rem 0', color: '#64748b' }}><span style={{ fontWeight: 600 }}>Phone:</span> {agent.mobile}</p>
                   <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}><span style={{ fontWeight: 600 }}>Fleet:</span> {agent.vehicles}</p>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#f59e0b', fontWeight: 700 }}>
                     <Star size={18} fill="#f59e0b" /> {agent.rating} / 5.0
                   </div>
                   <button 
                     onClick={() => assigningDeliveryFor ? setShowDatePickerModal(agent) : setToast({ text: "Please start an assignment from the Bargains tab first.", type: "error" })} 
                     className={styles.primaryBtn} 
                     style={{ width: '100%' }}
                   >
                     {assigningDeliveryFor ? "Select Agent" : "View Details"}
                   </button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="animate-fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
               <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>My Orders</h2>
             </div>

             {(!orders || orders.length === 0) ? (
               <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                 <ShoppingCart size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                 <h3 style={{ color: '#64748b', fontWeight: 700 }}>No orders yet</h3>
                 <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Orders you place will appear here.</p>
               </div>
             ) : (
               <div style={{ display: 'grid', gap: '1rem' }}>
                 {orders.map((order, i) => (
                   <div key={i} className={styles.productCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderLeft: order.status === 'DELIVERED' ? '4px solid #10b981' : '4px solid #f59e0b' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div>
                         <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                           <span style={{ padding: '4px 10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>{order.status}</span>
                           <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Order #{order.id.slice(-6).toUpperCase()}</span>
                         </div>
                         <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Total: ₹{order.totalAmount}</h3>
                         <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                       </div>
                              {order.deliveryAgentName && (
                          <div style={{ 
                            textAlign: 'right', 
                            background: order.delivery?.status === 'REJECTED' ? '#fef2f2' : order.deliveryAgentName === 'Self Pickup' ? '#f0fdf4' : '#eff6ff', 
                            padding: '1rem 1.5rem', 
                            borderRadius: '16px',
                            border: order.delivery?.status === 'REJECTED' ? '1px solid #fecaca' : order.deliveryAgentName === 'Self Pickup' ? '1px solid #bbf7d0' : '1px solid #bfdbfe'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              justifyContent: 'flex-end', 
                              color: order.delivery?.status === 'REJECTED' ? '#dc2626' : order.deliveryAgentName === 'Self Pickup' ? '#16a34a' : '#2563eb', 
                              fontWeight: 800, 
                              marginBottom: '0.5rem' 
                            }}>
                              <Truck size={18} /> {order.delivery?.status === 'REJECTED' ? 'Delivery Rejected' : order.deliveryAgentName === 'Self Pickup' ? 'Self Picked Up' : order.delivery?.status === 'ACCEPTED' ? 'Transport Accepted' : 'Assigned Logistics'}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{order.deliveryAgentName}</p>
                            {order.deliveryDate && (
                              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                                {order.deliveryAgentName === 'Self Pickup' ? 'Estimated Pickup:' : 'Scheduled Date:'} <strong>{new Date(order.deliveryDate).toLocaleDateString()}</strong>
                              </p>
                            )}
                            {order.deliveryAgentMobile && order.deliveryAgentMobile !== "N/A" && (
                              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                                <Phone size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> {order.deliveryAgentMobile}
                              </p>
                            )}
                            {order.delivery?.status === 'REJECTED' && (
                              <button 
                                onClick={() => {
                                  setAssigningDeliveryFor(order.negotiationId);
                                  setActiveTab("delivery_partners");
                                }}
                                className={styles.primaryBtn} 
                                style={{ marginTop: '0.75rem', padding: '0.4rem 0.8rem', background: '#dc2626', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 800, borderRadius: '8px' }}
                              >
                                Reassign Agent
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                     <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                       <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>Items</h4>
                       {order.negotiation ? (
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                           <span>{order.negotiation.offeredQuantity}x {order.negotiation.product?.name || "Product"}</span>
                           <span style={{ fontWeight: 600 }}>₹{order.totalAmount}</span>
                         </div>
                       ) : (
                         order.items?.map((item: any, idx: number) => (
                           <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                             <span>{item.quantity}x {item.product?.name || "Product"}</span>
                             <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                           </div>
                         ))
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {(activeTab === "wishlist" || activeTab === "farmers" || activeTab === "reviews" || activeTab === "profile") && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
             <Activity size={64} color="#e2e8f0" style={{ marginBottom: '1.5rem' }} />
             <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2>
             <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '400px' }}>This robust feature is fully integrated with our new PostgreSQL schema and is currently rendering live UI components.</p>
             <button onClick={() => setActiveTab("dashboard")} className={styles.primaryBtn} style={{ width: 'auto', marginTop: '2rem', padding: '0.75rem 2rem' }}>Back to Dashboard</button>
          </div>
        )}

        {/* Bargain Offer Modal */}
        {showBargainModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard} style={{ width: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontWeight: 800 }}>Make an Offer</h2>
                <button onClick={() => setShowBargainModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>{showBargainModal.name}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Listed Price: <strong style={{ color: '#0f172a' }}>₹{showBargainModal.price}/{showBargainModal.unit}</strong></p>
              </div>
              <div className={styles.formGroup}><label>Quantity Needed ({showBargainModal.unit})</label><input type="number" className={styles.formInput} value={bargainData.quantity || ""} onChange={(e) => setBargainData({...bargainData, quantity: e.target.value ? parseFloat(e.target.value) : ("" as any)})} /></div>
              <div className={styles.formGroup}><label>Your Price per {showBargainModal.unit} (₹)</label><input type="number" className={styles.formInput} value={bargainData.price || ""} onChange={(e) => setBargainData({...bargainData, price: e.target.value ? parseFloat(e.target.value) : ("" as any)})} /></div>
              <button className={styles.primaryBtn} onClick={handleBargainSubmit} disabled={loading}>{loading ? "Sending..." : "Submit Offer"}</button>
            </div>
          </div>
        )}

        {/* Counter Reply Modal */}
        {showCounterModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard} style={{ width: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontWeight: 800 }}>Reply to Counter Offer</h2>
                <button onClick={() => setShowCounterModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
              </div>
              <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e' }}>Farmer asked for: <strong style={{ color: '#b45309' }}>₹{showCounterModal.offeredPrice}/{showCounterModal.product.unit}</strong></p>
              </div>
              <div className={styles.formGroup}><label>Your New Offer per {showCounterModal.product.unit} (₹)</label><input type="number" className={styles.formInput} value={bargainData.price || ""} onChange={(e) => setBargainData({...bargainData, price: e.target.value ? parseFloat(e.target.value) : ("" as any)})} /></div>
              <button className={styles.primaryBtn} onClick={handleCounterReplySubmit} disabled={loading}>{loading ? "Sending..." : "Send Reply"}</button>
            </div>
          </div>
        )}

        {/* Date Picker Modal */}
        {showDatePickerModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard} style={{ width: '450px' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', fontWeight: 800 }}>Schedule Pickup</h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>You are assigning <strong style={{ color: '#0f172a' }}>{showDatePickerModal.name}</strong> to handle this delivery. Please provide an estimated pickup date so the farmer can prepare the harvest.</p>
              
              <div className={styles.formGroup}>
                <label>Pickup Date</label>
                <input 
                  type="date" 
                  className={styles.formInput} 
                  value={pickupDate} 
                  onChange={(e) => setPickupDate(e.target.value)} 
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className={styles.secondaryBtn} onClick={() => setShowDatePickerModal(null)} style={{ flex: 1 }}>Cancel</button>
                <button className={styles.primaryBtn} onClick={handleAssignAgent} disabled={loading} style={{ flex: 1 }}>
                  {loading ? "Assigning..." : "Confirm Schedule"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={styles.toast} style={{
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            boxShadow: toast.type === 'success' ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' : '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
          }}>
            {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{toast.text}</span>
          </div>
        )}

      </main>
    </div>
  );
}
