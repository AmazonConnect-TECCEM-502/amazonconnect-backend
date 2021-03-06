import { Request, Response } from "express";
import AbstractController from "./AbstractController";
import db from "../models";
import { timeStamp } from "console";

class SalesContoller extends AbstractController {
  private static instance: SalesContoller;

  public static getInstance(): AbstractController {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new SalesContoller("sales");
    return this.instance;
  }

  protected initRoutes(): void {
    this.router.get('/getProductCategories', this.getProductCategories.bind(this));
    this.router.get('/getProduct/:product_id', this.getProduct.bind(this));
    this.router.get('/getOwnedProducts/:client_id/:category_id', this.getOwnedProdcuts.bind(this));
    this.router.get('/getOwnedProducts/:client_id', this.getAllOwnedProducts.bind(this));
    this.router.get('/getNotOwnedProducts/:client_id/:category_id', this.getProductsNotOwned.bind(this));
    this.router.get('/getRecommendedProducts/:client_id/:category_id', this.getRecommendedProducts.bind(this));
    this.router.get('/orderHistory/:client_id', this.orderHistory.bind(this));
    this.router.post('/buyProduct', this.buyProduct.bind(this));
    this.router.post('/createProduct', this.createProduct.bind(this));
    this.router.get('/validateSku/:product_sku', this.validateSku.bind(this));
    this.router.post('/updateProduct', this.updateProduct.bind(this));
  }

  private async getOwnedProdcuts(req: Request, res: Response) {
    try {
      const products = await db.sequelize.query(`SELECT p.product_id, p.product_name, p.product_description, p.price FROM Product as p, \`Category-Product\` as cp WHERE p.product_id = cp.product_id and cp.category_id = ${req.params.category_id} and p.product_id in (SELECT product_id FROM \`Order\` WHERE client_id = ${req.params.client_id})`);
      res.status(200).send(products[0]);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      } else {
        res.status(501).send({ message: "External error" });
      }
    }
  }

  private async getAllOwnedProducts(req: Request, res: Response) {
    try {
      let products = [];
      for (var i = 1; i <= 3; i++) {
        let p = await db.sequelize.query(`SELECT p.product_id, p.product_sku, p.product_name, p.price, p.stock
        FROM Product as p, \`Order\` as o, \`Category-Product\` as cp
        WHERE client_id = ${req.params.client_id} and o.product_id = cp.product_id and cp.category_id = ${i} and p.product_id = cp.product_id
        ORDER BY purchased_date DESC LIMIT 1;`);
        products.push(p[0][0]);
      }
      for (var i = 4; i <= 6; i++) {
        let ps = await db.sequelize.query(`SELECT p.product_id, p.product_sku, p.product_name, p.price, p.stock
        FROM Product as p, \`Order\` as o, \`Category-Product\` as cp
        WHERE client_id = ${req.params.client_id} and o.product_id = cp.product_id and cp.category_id = ${i} and p.product_id = cp.product_id;`);
        await ps[0].forEach((product: any) => {
          products.push(product);
        });
      }
      res.status(200).send(products);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      } else {
        res.status(501).send({ message: "External error" });
      }
    }
  }

  private async orderHistory(req: Request, res: Response) {
    try {
      const orders = await db["Order"].findAll({
        where: { client_id: req.params.client_id }
      });
      res.status(200).send(orders);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      } else {
        res.status(501).send({ message: "External error" });
      }
    }
  }

  private async getProductsNotOwned(req: Request, res: Response) {
    try {
      const products = await db.sequelize.query(`SELECT p.product_id, p.product_sku, p.product_name, p.product_description, p.price FROM Product as p, \`Category-Product\` as cp WHERE p.product_id = cp.product_id and cp.category_id = ${req.params.category_id} and p.product_id not in (SELECT product_id FROM \`Order\` WHERE client_id = ${req.params.client_id})`);
      res.status(200).send(products[0]);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      }
      else {
        res.status(501).send({ message: "External error" });
      }
    }
  }

  private async getRecommendedProducts(req: Request, res: Response) {
    try {
      const validClient = await db["Client"].findOne({
        where: { client_id: req.params.client_id}
      });
      if (validClient) {
        if (Number(req.params.category_id) < 4) {
          const products = await db.sequelize.query(`SELECT p.product_id, p.product_sku, p.product_name, p.product_description, p.price FROM Product as p, \`Category-Product\` as cp WHERE p.product_id = cp.product_id and cp.category_id = ${req.params.category_id} and p.product_sku > all (SELECT product_sku FROM Product WHERE product_id in (SELECT o.product_id FROM \`Order\` as o, \`Category-Product\` as cp WHERE o.client_id = ${req.params.client_id} and cp.product_id = o.product_id and cp.category_id = ${req.params.category_id}))`);
          res.status(200).send(products[0]);
        }
        else {
          const products = await db.sequelize.query(`SELECT p.product_id, product_sku, p.product_name, p.product_description, p.price FROM Product as p, \`Category-Product\` as cp WHERE p.product_id = cp.product_id and cp.category_id = ${req.params.category_id} and p.product_id not in (SELECT product_id FROM \`Order\` WHERE client_id = ${req.params.client_id})`);
          res.status(200).send(products[0]);
        }
      }
      else {
        res.status(400).send("An invalid client_id was provided. Make sure a client with that ID exists.");
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      } else {
        res.status(501).send({ message: "External error" });
      }
    }
  }

  private async getProductCategories(req: Request, res: Response) {
    try {
      const productsCategory = await db["Product_category"].findAll({
        attributes: ["category_name", "category_id"],
      });
      res.status(200).send(productsCategory);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      } else {
        res.status(501).send({ message: "External error" });
      }
    }
  }

  private async getProduct(req: Request, res: Response) {
    try {
      const product = await db["Product"].findOne({
        where: { product_id: req.params.product_id },
        });
      res.status(200).send(product);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      } else {
        res.status(501).send({ message: "External error" });
      }
    }
  }

  private async buyProduct(req: Request, res: Response) {
    try {
      const validClient = await db["Client"].findOne({
        where: { client_id: req.body.client_id}
      });
      if (validClient) {
        const product = await db["Product"].findOne({
          where: { product_id: req.body.product_id}
        });
        if (product) {
          product.stock = product.stock - 1;
          product.save();
          await db["Order"].create({
            total: product.price,
            product_id: req.body.product_id,
            client_id: req.body.client_id
          });
          res.status(200).send(`${product.product_name} added to client ${req.body.client_id}`)
        }
        else {
          res.status(400).send("An invalid product_id was provided. Make sure a product with that ID exists.")
        }
      }
      else {
        res.status(400).send("An invalid client_id was provided. Make sure a client with that ID exists.")
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      } else {
        res.status(501).send({ message: "External error" });
      }
    }
  }

  private async createProduct(req: Request, res: Response) {
    try {
      const product = await db["Product"].findOne({
        where: { product_sku: req.body.product_sku}
      });
      if (product) {
        res.status(400).send({ message: "A product with this sku already exists"})
      } else {
        const new_product = await db["Product"].create({
          product_sku: req.body.product_sku,
          product_name: req.body.product_name,
          product_description: req.body.product_description,
          price: req.body.price,
          stock: req.body.stock
        });
        const catprod = await db.sequelize.query(`INSERT INTO \`Category-Product\` (product_id, category_id) VALUES (${new_product.product_id}, ${req.body.category});`);
        res.status(200).send('Product create with success');
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      } else {
        res.status(501).send({ message: "External error" });
      }
    }
  }

  private async validateSku(req: Request, res: Response) {
    try {
      const product = await db["Product"].findOne({
        where: { product_sku: req.params.product_sku}
      });
      if (product) {
        const catprod = await db.sequelize.query(`SELECT category_id FROM \`Category-Product\` WHERE product_id = ${product.product_id};`);
        res.status(200).send({
                              product: product,
                              category: catprod[0][0]
                            }
                            );
      }
      else {
        res.status(400).send("No product was found with given sku");
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      } else {
        res.status(501).send({ message: "External error" });
      }
    }
  }

  private async updateProduct(req: Request, res: Response) {
    try {
      const product = await db["Product"].findOne({
        where: { product_id: req.body.product_id}
      });
      if (req.body.product_name) {
        product.product_name = req.body.product_name;
      }
      if (req.body.product_description) {
        product.product_description = req.body.product_description;
      }
      if (req.body.price) {
        product.price = req.body.price;
      }
      if (req.body.stock) {
        product.stock = req.body.stock;
      }
      product.save();
      if (req.body.category_id) {
        const catprod = await db.sequelize.query(`UPDATE \`Category-Product\` SET category_id = ${req.body.category_id} WHERE product_id = ${product.product_id};`);
      }
      res.status(200).send("Product updated");
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send({ message: error.message });
      } else {
        res.status(501).send({ message: "External error" });
      }
  }
  }
}
export default SalesContoller;
