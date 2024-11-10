import styles from "./styles.module.css";
import { sanityFetch } from "@/sanity/live";
import { Game } from "../Game";

export default async function Presents() {
  const { data } = await sanityFetch({ query: '*[_type == "post"]' });

  return (
    <div>
      <div className={`${styles.snowflakes}`} aria-hidden="true">
        <div className={`${styles.snowflake}`}>🎁</div>
        <div className={`${styles.snowflake}`}>🎁</div>
        <div className={`${styles.snowflake}`}>🎁</div>
        <div className={`${styles.snowflake}`}>🎁</div>
        <div className={`${styles.snowflake}`}>🎁</div>
        <div className={`${styles.snowflake}`}>🎁</div>
        <div className={`${styles.snowflake}`}>🎁</div>
        <div className={`${styles.snowflake}`}>🎁</div>
        <div className={`${styles.snowflake}`}>🎁</div>
        <div className={`${styles.snowflake}`}>🎁</div>
      </div>

      <h1 className={`${styles.title}`}>List</h1>
      <section className={`${styles.childrenSection}`}>
        {data.map((c) => {
          return (
            <section className={`${styles.child}`}>
              <p>First name: {c.firstname}</p>
              <p>Last name: {c.lastname}</p>
              <p>Present: {c.present}</p>
              {/* <Game present={c.present} /> */}
            </section>
          );
        })}
        {data.length ? <Game present="" /> : null}
      </section>
    </div>
  );
}
