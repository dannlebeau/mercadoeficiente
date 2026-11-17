import Link from "next/link";

export default function NoEncontrado() {
  return (
    <section className="tarjeta">
      <h1>No encontramos esa página</h1>
      <p>
        Si buscabas una licitación, revisa que el código esté bien escrito (formato <code>NNNN-NN-XXNN</code>, ej. 4547-54-LR24). Puede que
        aún no esté publicada en Mercado Público.
      </p>
      <Link className="boton" href="/">Ir al buscador</Link>
    </section>
  );
}
