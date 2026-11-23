import { useLocation } from 'react-router-dom';
import { MENU_ITEMS } from '../config';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';

export default function Placeholder({ note }) {
  const { pathname } = useLocation();
  const item = MENU_ITEMS.find((i) => i.to === pathname);

  if (!item) {
    return (
      <>
        <PageHeader title="Sayfa bulunamadı" />
        <Panel><p className="mb-0">Bu adreste bir sayfa yok. Soldaki menüden devam edin.</p></Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader title={item.label} />
      <Panel>
        <div className="empty">
          <i className={`bi bi-${item.icon} d-block fs-1 mb-2`} aria-hidden="true" />
          <p className="mb-1 fw-medium text-body">Bu bölüm henüz hazır değil.</p>
          <p className="mb-0">{note || 'Geliştirme planında yer alıyor; hazır olduğunda bu menüden açılacak.'}</p>
        </div>
      </Panel>
    </>
  );
}
