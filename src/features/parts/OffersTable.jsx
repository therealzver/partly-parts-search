export default function OffersTable({ offers }) {
  return (
    <div className="table-responsive" role="region" aria-label="Таблица предложений" tabIndex={0}>
      <table className="table table-hover align-middle mb-0">
        <caption>Доступные запчасти и предложения</caption>
        <thead>
          <tr>
            <th scope="col">Наименование</th>
            <th scope="col">Производитель</th>
            <th scope="col">Артикул</th>
            <th scope="col" className="text-end">Цена</th>
            <th scope="col">Валюта</th>
            <th scope="col" className="text-end">Остаток, шт.</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id}>
              <td>{offer.name}</td>
              <td>{offer.manufacturer}</td>
              <td className="text-nowrap">{offer.article}</td>
              <td className="text-end text-nowrap numeric">{new Intl.NumberFormat('ru-RU', {
                style: 'currency', currency: offer.currency,
              }).format(offer.price)}</td>
              <td>{offer.currency}</td>
              <td className="text-end numeric">{offer.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
