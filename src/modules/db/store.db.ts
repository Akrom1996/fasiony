import { PrismaClient } from '@prisma/client';
import { ItemModel } from '../dto/item.model.dto';

export const storeItemInfoInDB = async (
  itemBody: ItemModel[],
  client: PrismaClient,
): Promise<any> => {
  console.log(itemBody.length);
  for (let i = 0; i < itemBody.length; i++) {
    const variance = [];
    let price;
    const itemData = await client.items.findUnique({
      where: {
        itemName: itemBody[i].item,
      },
      include: {
        variance: true,
      },
    });
    itemBody[i].sizePrice.forEach(async (element) => {
      variance.push({
        varianceName: element.size + ' ' + itemBody[i].brand,
        websites: {
          create: [
            {
              price: element.sizePrice,
              websites: {
                connectOrCreate: {
                  where: {
                    url: itemBody[i].url,
                  },
                  create: {
                    url: itemBody[i].url,
                  },
                },
              },
            },
          ],
        },
      });
    }); // creating variance with url n:m connection
    if (itemBody[i].sizePrice.length == 0) {
      price = itemBody[i].price;
    }
    if (!itemData) {
      console.log('item does not exist');
      const data = {
        itemName: itemBody[i].item,
        brandName: itemBody[i].brand,
        details: itemBody[i].details,
        imageUrl: itemBody[i].imageUrl,
        highlights: itemBody[i].highlights,
      };
      if (price)
        data['prices'] = {
          create: [
            {
              price: price,
              website: {
                connectOrCreate: {
                  where: {
                    url: itemBody[i].url,
                  },
                  create: {
                    url: itemBody[i].url,
                  },
                },
              },
            },
          ],
        };
      else
        data['variance'] = {
          create: variance,
        };
      await client.items.create({
        data: data,
      });
    } else {
      // if variance of Item NOT exists (only one size)
      if (itemBody[i].sizePrice.length == 0) {
        await client.items.update({
          where: {
            itemName: itemBody[i].item,
          },
          include: {
            prices: true,
          },
          data: {
            prices: {
              create: {
                price: itemBody[i].price,
                website: {
                  connectOrCreate: {
                    where: { url: itemBody[i].url },
                    create: {
                      url: itemBody[i].url,
                    },
                  },
                },
              },
            },
          },
        });
      }
      itemBody[i].sizePrice.forEach(async (element) => {
        if (
          itemData.variance.filter((data) => data.varianceName == element.size)
            .length == 0
        ) {
          // if new vairance NOT exists create new variance
          await client.items.update({
            where: {
              itemName: itemBody[i].item,
            },
            include: {
              variance: true,
            },
            data: {
              variance: {
                connectOrCreate: {
                  where: {
                    varianceName: element.size,
                  },
                  create: {
                    varianceName: element.size,
                    websites: {
                      create: {
                        price: element.sizePrice,
                        websites: {
                          connectOrCreate: {
                            where: { url: itemBody[i].url },
                            create: {
                              url: itemBody[i].url,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        } else {
          // else new variance exists add new price of variance
          await client.items.update({
            where: {
              itemName: itemBody[i].item,
            },
            include: {
              variance: true,
            },
            data: {
              variance: {
                connect: {
                  varianceName: element.size,
                },
                update: {
                  where: {
                    varianceName: element.size,
                  },
                  data: {
                    websites: {
                      create: [
                        {
                          price: element.sizePrice,
                          websites: {
                            connect: {
                              url: itemBody[i].url,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          });
        }
      });
    }
  }
  // await client.items.findMany().then((data) => console.log(data));
  return 'success';
};
