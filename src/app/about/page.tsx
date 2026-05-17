import { Sprout, Users, Globe, Target } from "lucide-react";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.title}>About AgriConnect</h1>
        <p className={styles.subtitle}>
          Bridging the gap between the soil and your plate. We are on a mission to revolutionize 
          the agricultural supply chain by eliminating intermediaries and empowering local farmers.
        </p>
      </section>

      {/* Mission Section */}
      <section className={styles.mission}>
        <div className={styles.missionGrid}>
          <div className={`${styles.missionCard} glass-panel`}>
            <div className={styles.iconWrapper}>
              <Target size={32} />
            </div>
            <h2>Our Mission</h2>
            <p>
              To create a fair, transparent, and efficient marketplace where farmers get the price they deserve, 
              and consumers get access to fresh, high-quality organic produce.
            </p>
          </div>
          
          <div className={`${styles.missionCard} glass-panel`}>
            <div className={styles.iconWrapper}>
              <Globe size={32} />
            </div>
            <h2>Our Vision</h2>
            <p>
              A sustainable agricultural ecosystem powered by AI, real-time logistics, and community trust. 
              We envision a world where local farming communities thrive.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className={styles.values}>
        <h2 className={styles.sectionTitle}>What Drives Us</h2>
        <div className={styles.valuesGrid}>
          <div className={`${styles.valueItem} glass-panel`}>
            <Sprout size={24} className={styles.valueIcon} />
            <h3>Sustainability</h3>
            <p>Promoting organic and eco-friendly farming methods for a healthier planet.</p>
          </div>
          <div className={`${styles.valueItem} glass-panel`}>
            <Users size={24} className={styles.valueIcon} />
            <h3>Community First</h3>
            <p>Building strong relationships between producers and consumers in local regions.</p>
          </div>
          <div className={`${styles.valueItem} glass-panel`}>
            <ShieldCheckIcon />
            <h3>Transparency</h3>
            <p>Clear pricing, open communication, and traceable origin for every product.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ShieldCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.valueIcon}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
