/**
 * Le personnage, vu de dos, en buste : photo détourée (public/silhouette-dos.webp, fond transparent).
 * `lookAt` (-1 à 1) l'oriente très légèrement vers l'élément survolé (rotation 3D douce, via --turn).
 */
export default function Bust({ lookAt = 0 }) {
  const turn = Math.max(-1, Math.min(1, lookAt)) * 3

  return (
    <div className="bust" style={{ '--turn': `${turn}deg` }}>
      <img
        src="/silhouette-dos.webp"
        alt="Un jeune homme, vu de dos, face au couloir de son parcours"
        width="900"
        height="916"
        decoding="async"
        draggable="false"
      />
    </div>
  )
}
