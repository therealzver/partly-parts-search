export default function OffersTable({ offers }) {
  return (
    <div className="table-responsive">
      <table className="table table-striped align-middle">
        <caption>Available parts and offers</caption>
        <thead>
          <tr>
            <th scope="col">Part name</th>
            <th scope="col">Manufacturer</th>
            <th scope="col">Article</th>
            <th scope="col">Price</th>
            <th scope="col">Currency</th>
            <th scope="col">Stock</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id}>
              <td>{offer.name}</td>
              <td>{offer.manufacturer}</td>
              <td>{offer.article}</td>
              <td>{new Intl.NumberFormat('en-GB', {
                style: 'currency', currency: offer.currency,
              }).format(offer.price)}</td>
              <td>{offer.currency}</td>
              <td>{offer.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
