const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Review_images",
  tableName: "REVIEW_IMAGES",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    review_id: {
      type: "uuid",
      nullable: false,
    },
    image: {
      type: "varchar",
      length: 2048,
      nullable: true,
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
    Reviews: {
      target: "Reviews",
      type: "many-to-one",
      joinColumn: {
        name: "review_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "review_images_reviews_id_fk",
      },
      onDelete: "CASCADE",
    },
  },
});
