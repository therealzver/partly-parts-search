// Demonstration data only: prices, stock, and cross-references are fictional.
// Each lookup brand includes an original part and an illustrative alternative.
export const mockCatalog = {
  OC384: {
    MAHLE: [
      { id: 'oc384-mahle-1', article: 'OC384', name: 'Масляный фильтр', manufacturer: 'MAHLE', price: 12.5, currency: 'EUR', stock: 24 },
      { id: 'oc384-mahle-2', article: 'W712/95', name: 'Масляный фильтр', manufacturer: 'MANN-FILTER', price: 14.9, currency: 'EUR', stock: 8 },
    ],
    'MANN-FILTER': [
      { id: 'oc384-mann-1', article: 'W712/95', name: 'Масляный фильтр', manufacturer: 'MANN-FILTER', price: 13.8, currency: 'EUR', stock: 15 },
      { id: 'oc384-mann-2', article: 'OC384', name: 'Масляный фильтр', manufacturer: 'MAHLE', price: 11.9, currency: 'EUR', stock: 0 },
    ],
  },
  '0986AF1234': {
    BOSCH: [
      { id: '0986af1234-bosch-1', article: '0986AF1234', name: 'Воздушный фильтр', manufacturer: 'BOSCH', price: 19.5, currency: 'EUR', stock: 32 },
      { id: '0986af1234-bosch-2', article: 'LX2046', name: 'Воздушный фильтр', manufacturer: 'MAHLE', price: 21.2, currency: 'EUR', stock: 6 },
    ],
    MAHLE: [
      { id: '0986af1234-mahle-1', article: 'LX2046', name: 'Воздушный фильтр', manufacturer: 'MAHLE', price: 20.7, currency: 'EUR', stock: 11 },
      { id: '0986af1234-mahle-2', article: '0986AF1234', name: 'Воздушный фильтр', manufacturer: 'BOSCH', price: 18.9, currency: 'EUR', stock: 3 },
    ],
  },
  C27009: {
    'MANN-FILTER': [
      { id: 'c27009-mann-1', article: 'C27009', name: 'Воздушный фильтр', manufacturer: 'MANN-FILTER', price: 23.9, currency: 'EUR', stock: 18 },
      { id: 'c27009-mann-2', article: 'F026400321', name: 'Воздушный фильтр', manufacturer: 'BOSCH', price: 22.4, currency: 'EUR', stock: 7 },
    ],
    BOSCH: [
      { id: 'c27009-bosch-1', article: 'F026400321', name: 'Воздушный фильтр', manufacturer: 'BOSCH', price: 21.8, currency: 'EUR', stock: 26 },
      { id: 'c27009-bosch-2', article: 'C27009', name: 'Воздушный фильтр', manufacturer: 'MANN-FILTER', price: 24.5, currency: 'EUR', stock: 4 },
    ],
  },
}
