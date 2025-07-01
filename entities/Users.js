const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Users",
  tableName: "USERS",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    role_id: {
      type: "uuid",
      nullable: false,
    },
    googleId: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    name: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    email: {
      type: "varchar",
      length: 320,
      nullable: false,
      unique: true,
    },
    password: {
      type: "varchar",
      length: 72,
      nullable: true,
      select: false,
    },
    photo: {
      type: "varchar",
      length: 2048,
      nullable: true,
    },
    gender: {
      type: "varchar",
      length: 10,
      nullable: true,
    },
    birth_date: {
      type: "date",
      nullable: true,
    },
    phone: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    address_zipcode: {
      type: "text",
      nullable: true,
    },
    address_city: {
      type: "text",
      nullable: true,
    },
    address_district: {
      type: "text",
      nullable: true,
    },
    address_detail: {
      type: "text",
      nullable: true,
    },
    is_banned: {
      type: "boolean",
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
    Roles: {
      target: "Roles",
      type: "many-to-one",
      joinColumn: {
        name: "role_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "user_role_id_fk",
      },
    },
    Favorites: {
      target: "Favorites",
      type: "one-to-many",
      inverseSide: "Users",
    },
    Reviews: {
      target: "Reviews",
      type: "one-to-many",
      inverseSide: "Users",
    },
  },
});
