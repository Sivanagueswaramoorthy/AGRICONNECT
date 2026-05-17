import { MapPin, Star, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

const MOCK_FARMERS = [
  {
    id: "1",
    name: "Ramesh Kumar",
    farmName: "Green Valley Farms",
    location: "Nashik, MH",
    method: "100% Organic",
    rating: 4.9,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?w=500&q=80",
    description: "Growing organic vegetables for over 15 years. Specializes in red onions and tomatoes.",
    verified: true,
  },
  {
    id: "2",
    name: "Suresh Patil",
    farmName: "Suresh Farm",
    location: "Pune, MH",
    method: "Mixed Farming",
    rating: 4.7,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=500&q=80",
    description: "A 10-acre farm dedicated to fresh daily vegetables and grains. Known for quality.",
    verified: true,
  },
  {
    id: "3",
    name: "Amit Desai",
    farmName: "Konkan Orchards",
    location: "Ratnagiri, MH",
    method: "Organic Fruit",
    rating: 5.0,
    reviews: 210,
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80",
    description: "Award-winning Alphonso mangoes and tropical fruits straight from the Konkan coast.",
    verified: true,
  }
];

export default function FarmersPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Meet Our Farmers</h1>
        <p className={styles.subtitle}>
          Discover the hardworking people who grow your food. We connect you directly with 
          verified, local farmers committed to quality and sustainability.
        </p>
      </header>

      <div className={styles.grid}>
        {MOCK_FARMERS.map((farmer) => (
          <div key={farmer.id} className={`${styles.farmerCard} glass-panel animate-fade-in`}>
            <div className={styles.imageContainer}>
              <img src={farmer.image} alt={farmer.name} className={styles.image} />
              {farmer.verified && (
                <div className={styles.verifiedBadge}>
                  <ShieldCheck size={14} /> Verified
                </div>
              )}
            </div>
            
            <div className={styles.info}>
              <h2 className={styles.farmName}>{farmer.farmName}</h2>
              <p className={styles.farmerName}>by {farmer.name}</p>
              
              <div className={styles.meta}>
                <div className={styles.metaItem}>
                  <MapPin size={16} className={styles.icon} />
                  <span>{farmer.location}</span>
                </div>
                <div className={styles.metaItem}>
                  <Star size={16} className={styles.starIcon} />
                  <span>{farmer.rating} ({farmer.reviews} reviews)</span>
                </div>
              </div>

              <p className={styles.method}><span className={styles.methodDot}></span>{farmer.method}</p>
              <p className={styles.description}>{farmer.description}</p>
              
              <Link href="/marketplace" className={styles.visitBtn}>
                View Products <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
