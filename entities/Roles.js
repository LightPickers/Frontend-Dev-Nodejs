const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Roles',
    tableName: 'ROLES',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid'
        },
        name: {
            type: 'varchar',
            length: 50,
            nullable: false
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            nullable: false
        },
        updated_at: {
            type: 'timestamp',
            updateDate: true,
            nullable: false
        }
    },
    relations: {
        Users: {
          target: 'Users',
          type: 'one-to-many',
          inverseSide: 'Roles',
        }
      }
});