import Link from 'next/link';
import styles from './page.module.css';

export default async function Home() {
  let customers = [];
  try {
    const res = await fetch('http://localhost:5000/customers', { cache: 'no-store' });
    if (res.ok) {
      customers = await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch customers", e);
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Customer Support</h1>
          <p className={styles.subtitle}>Select a customer to view their AI conversation history and step in to help.</p>
        </div>
        
        <div className={styles.grid}>
          {customers.map((customer: any) => (
            <Link 
              key={customer.customer_id} 
              href={`/customer/${customer.customer_id}`}
              className={styles.card}
            >
              <div className={styles.avatar}>{customer.name.charAt(0)}</div>
              <div className={styles.info}>
                <h2>{customer.name}</h2>
                <p>{customer.email}</p>
              </div>
            </Link>
          ))}
          {customers.length === 0 && (
            <p className={styles.empty}>No customers found. Make sure the backend is running on port 3000.</p>
          )}
        </div>
      </div>
    </main>
  );
}
