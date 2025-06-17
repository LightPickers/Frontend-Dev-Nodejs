const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Conversations",
  tableName: "CONVERSATIONS",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
      nullable: false,
    },
    user_id: {
      type: "uuid",
      nullable: false,
    },
    last_activity: {
      type: "timestamp",
      name: "last_activity",
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
    Users: {
      target: "Users",
      type: "many-to-one",
      joinColumn: {
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "conversations_users_id_fk",
      },
    },
    Messages: {
      target: "Messages",
      type: "one-to-many",
      inverseSide: "conversations",
    },
  },
});
