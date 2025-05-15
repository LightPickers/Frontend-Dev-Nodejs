const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Product_images",
  tableName: "PRODUCT_IMAGES",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    product_id: {
      type: "uuid",
      nullable: false,
    },
    image: {
      type: "varchar",
      length: 2048,
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
    Products: {
      target: "Products",
      type: "many-to-one",
      joinColumn: {
        name: "product_id",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
  },
  foreignKeys: [
    {
      columnNames: ["product_id"],
      referencedTableName: "Products",
      referencedColumnNames: ["id"],
    },
  ],
});
