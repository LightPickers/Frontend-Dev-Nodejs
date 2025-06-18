const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Messages",
  tableName: "MESSAGES",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
      nullable: false,
    },
    conversation_id: {
      type: "uuid",
      nullable: false,
    },
    role: {
      type: "varchar",
      length: 20,
      nullable: false,
    },
    content: {
      type: "text",
      nullable: false,
    },
    sent_at: {
      type: "timestamp",
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
    Conversations: {
      type: "many-to-one",
      target: "Conversations",
      joinColumn: {
        name: "conversation_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "message_conversation_id_fk",
      },
      onDelete: "CASCADE",
    },
  },
});
