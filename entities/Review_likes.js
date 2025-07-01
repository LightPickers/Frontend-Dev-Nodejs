const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Review_likes",
  tableName: "REVIEW_LIKES",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    user_id: {
      type: "uuid",
      nullable: false,
    },
    review_id: {
      type: "uuid",
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
        foreignKeyConstraintName: "review_likes_users_id_fk",
      },
      onDelete: "CASCADE",
    },
    Reviews: {
      target: "Reviews",
      type: "many-to-one",
      joinColumn: {
        name: "review_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "review_likes_reviews_id_fk",
      },
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_USER_REVIEW_UNIQUE",
      columns: ["user_id", "review_id"],
      unique: true,
    },
  ],
});
