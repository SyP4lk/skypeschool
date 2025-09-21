import styles from './DecorBlobs.module.css';
export default function DecorBlobs({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.blobs} ${className}`} aria-hidden>
      <span className={`${styles.blob} ${styles.b1}`} />
      <span className={`${styles.blob} ${styles.b2}`} />
      <span className={`${styles.blob} ${styles.b3}`} />
    </div>
  );
}
