import { ADVANTAGES } from "./data/advantages-data";
import styles from "./Advantages.module.css";

/* Group advantages into pairs */
function chunkPairs<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    result.push(arr.slice(i, i + 2));
  }
  return result;
}

const PAIRS = chunkPairs(ADVANTAGES);

export default function Advantages() {
  return (
    <div className={styles.stickyCards}>
      {PAIRS.map((pair, pairIndex) => (
        <div className={styles.stickyRow} key={pairIndex}>
          {pair.map((card, cardIndex) => (
            <div
              className={styles.stickyCard}
              key={cardIndex}
              data-variant={(pairIndex * 2 + cardIndex) % 3}
            >
              <div className={styles.cardImg}>
                <img src={card.image} alt={card.title} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
