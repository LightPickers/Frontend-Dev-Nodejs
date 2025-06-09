const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Products",
  tableName: "PRODUCTS",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    category_id: {
      type: "uuid",
      nullable: false,
    },
    brand_id: {
      type: "uuid",
      nullable: false,
    },
    condition_id: {
      type: "uuid",
      nullable: false,
    },
    name: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    title: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    subtitle: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    hashtags: {
      type: "text",
      array: true,
      nullable: false,
    },
    description: {
      type: "jsonb",
      nullable: false,
    },
    summary: {
      type: "text",
      array: true,
      nullable: false,
    },
    primary_image: {
      type: "varchar",
      length: 2048,
      nullable: false,
    },
    original_price: {
      type: "integer",
      nullable: false,
    },
    selling_price: {
      type: "integer",
      nullable: false,
    },
    is_available: {
      type: "boolean",
      nullable: false,
    },
    is_featured: {
      type: "boolean",
      nullable: false,
    },
    is_sold: {
      type: "boolean",
      default: "false",
      nullable: false,
    },
    is_deleted: {
      type: "boolean",
      default: "false",
      nullable: false,
    },
    created_at: {
      type: "timestamp",
      createDate: true,
      nullable: false,
    },
    updated_at: {
      type: "timestamp",
      updateDate: true,
      nullable: false,
    },
  },
  relations: {
    Categories: {
      target: "Categories",
      type: "many-to-one",
      joinColumn: {
        name: "category_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "products_categories_id_fk",
      },
    },
    Brands: {
      target: "Brands",
      type: "many-to-one",
      joinColumn: {
        name: "brand_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "products_brands_id_fk",
      },
    },
    Conditions: {
      target: "Conditions",
      type: "many-to-one",
      joinColumn: {
        name: "condition_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "products_conditions_id_fk",
      },
    },
    Favorites: {
      target: "Favorites",
      type: "one-to-many",
      inverseSide: "Products",
    },
    Product_images: {
      target: "Product_images",
      type: "one-to-many",
      inverseSide: "Products",
    },
  },
});
