"use client";

import { ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import styles from "./page.module.css";
import Link from "next/link";

const MOCK_CART = [
  {
    id: "1",
    name: "Organic Red Onions",
    farmer: "Ramesh Kumar",
    price: 32,
    unit: "kg",
    quantity: 2,
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&q=80",
  },
  {
    id: "2",
    name: "Alphonso Mangoes",
    farmer: "Konkan Orchards",
    price: 600,
    unit: "dozen",
    quantity: 1,
    image: "https://images.unsplash.com/photo-1553279768-865429fd80dc?w=500&q=80",
  }
];

export default function CartPage() {
  const subtotal = MOCK_CART.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Shopping Cart</h1>
      
      <div className={styles.layout}>
        {/* Cart Items */}
        <div className={styles.cartItems}>
          {MOCK_CART.map((item) => (
            <div key={item.id} className={`${styles.cartItem} glass-panel`}>
              <img src={item.image} alt={item.name} className={styles.itemImage} />
              <div className={styles.itemDetails}>
                <h3>{item.name}</h3>
                <p className={styles.farmerName}>Sold by: {item.farmer}</p>
                <div className={styles.priceRow}>
                  <span className={styles.price}>₹{item.price}/{item.unit}</span>
                </div>
              </div>
              <div className={styles.itemActions}>
                <div className={styles.quantityControl}>
                  <button className={styles.qtyBtn}>-</button>
                  <span>{item.quantity}</span>
                  <button className={styles.qtyBtn}>+</button>
                </div>
                <button className={styles.deleteBtn}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className={styles.summarySection}>
          <div className={`${styles.summaryCard} glass-panel`}>
            <h2>Order Summary</h2>
            
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Delivery Partner Fee</span>
              <span>₹{deliveryFee}</span>
            </div>
            
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span className={styles.totalPrice}>₹{total}</span>
            </div>

            <button className={`btn-primary ${styles.checkoutBtn}`}>
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            <p className={styles.secureText}>Guaranteed fresh delivery.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
