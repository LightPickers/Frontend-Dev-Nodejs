const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Favorites",
  tableName: "FAVORITES",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
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
        name: "id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "favorites_products_id_fk",
      },
      onDelete: "CASCADE",
    },
    Users: {
      target: "Users",
      type: "many-to-one",
      joinColumn: {
        name: "id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "favorites_users_id_fk",
      },
      onDelete: "CASCADE",
    },
  },
});
