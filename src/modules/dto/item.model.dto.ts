export class ItemModel {
  url: string;
  item: string;
  brand: string;
  price: any;
  sizePrice: SizePrice[];
  imageUrl: string;
  details: string;
  highlights: string[];
  dateTime: string;
}

class SizePrice {
  size: string;
  sizePrice: string;
}
