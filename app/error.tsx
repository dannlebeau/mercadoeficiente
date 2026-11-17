"use client";

export default function ErrorPagina({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="tarjeta" role="alert">
      <h1>Algo falló al cargar la página</h1>
      <p>Puede que Mercado Público no esté respondiendo. Intenta de nuevo en unos minutos.</p>
      <button type="button" className="boton" onClick={reset}>Reintentar</button>
    </section>
  );
}
