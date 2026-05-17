"use client";

import { useState } from "react";
import { ShoppingBag, Heart, Clock, Truck, MapPin } from "lucide-react";
import styles from "./page.module.css";

const MOCK_ORDERS = [
  { id: "ORD-2024-001", date: "Oct 24, 2024", total: 450, status: "Delivered", items: "Red Onions, Tomatoes" },
  { id: "ORD-2024-002", date: "Oct 28, 2024", total: 1200, status: "On the way", items: "Alphonso Mangoes, Farm Milk" },
];

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={`${styles.profileCard} glass-panel`}>
          <div className={styles.avatar}>JD</div>
          <h3>John Doe</h3>
          <p>john.doe@example.com</p>
        </div>

        <nav className={styles.navMenu}>
          <button 
            className={`${styles.navItem} ${activeTab === "orders" ? styles.active : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingBag size={20} /> My Orders
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === "wishlist" ? styles.active : ""}`}
            onClick={() => setActiveTab("wishlist")}
          >
            <Heart size={20} /> Wishlist
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === "subscriptions" ? styles.active : ""}`}
            onClick={() => setActiveTab("subscriptions")}
          >
            <Clock size={20} /> Subscriptions
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === "addresses" ? styles.active : ""}`}
            onClick={() => setActiveTab("addresses")}
          >
            <MapPin size={20} /> Addresses
          </button>
        </nav>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1>My Orders</h1>
        </div>

        <div className={styles.orderList}>
          {MOCK_ORDERS.map((order) => (
            <div key={order.id} className={`${styles.orderCard} glass-panel animate-fade-in`}>
              <div className={styles.orderHeader}>
                <div>
                  <h3 className={styles.orderId}>{order.id}</h3>
                  <p className={styles.orderDate}>Placed on {order.date}</p>
                </div>
                <div className={styles.orderStatus}>
                  <span className={`${styles.badge} ${order.status === 'Delivered' ? styles.badgeSuccess : styles.badgeWarning}`}>
                    {order.status === 'On the way' && <Truck size={14} style={{ marginRight: '4px' }}/>}
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className={styles.orderDetails}>
                <div className={styles.itemsList}>
                  <p className={styles.itemsLabel}>Items:</p>
                  <p>{order.items}</p>
                </div>
                <div className={styles.orderTotal}>
                  <p className={styles.itemsLabel}>Total:</p>
                  <p className={styles.price}>₹{order.total}</p>
                </div>
              </div>
              
              <div className={styles.orderActions}>
                {order.status === 'On the way' ? (
                  <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Track Order</button>
                ) : (
                  <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>Reorder</button>
                )}
                <button className={styles.textBtn}>View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
