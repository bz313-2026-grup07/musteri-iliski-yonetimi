/** Henüz yazılmamış sayfalar için yer tutucu. Sayfayı yazınca App.jsx'teki rotayı gerçek bileşenle değiştirin. */
export default function Placeholder({ title, sprint }) {
  return (
    <>
      <h1 className="h3">{title}</h1>
      <div className="alert alert-info">Bu modül {sprint} kapsamında geliştirilecek.</div>
    </>
  );
}
