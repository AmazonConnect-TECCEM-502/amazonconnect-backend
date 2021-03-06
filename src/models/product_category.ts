/* 
Tabla product_category No llaves foraneas 
*/
import { Model } from "sequelize";

const fkName = "category_id";

interface ModelAttributes {
  category_id: number;
  category_name: string;
  category_description: string;
}

module.exports = (sequelize: any, DataTypes: any) => {
  class Product_category
    extends Model<ModelAttributes>
    implements ModelAttributes
  {
    category_id!: number;
    category_name!: string;
    category_description!: string;

    static associate(models: any) {
      Product_category.belongsToMany(models.Product, {
        through: "Category-Product",
        foreignKey: fkName,
      });
    }
  }

  Product_category.init(
    {
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      category_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category_description: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "Product_category",
    }
  );
  return Product_category;
};
