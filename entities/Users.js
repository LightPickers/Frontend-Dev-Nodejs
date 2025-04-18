const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Users',
    tableName: 'USERS',
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
            email: {
                type: 'varchar',
                length: 320,
                nullable: false,
                unique: true
            },
            password: {
                type: 'varchar',
                length: 72,
                nullable: false,
                select: false
            },
            photo: {
                type: 'varchar',
                length: 2048
            },
            gender: {
                type: 'varchar',
                length: 5,
                nullable: false
            },
            phone: {
                type: 'varchar',
                length: 20,
                nullable: false
            },
            address_zipcode: {
                type: 'text',
                nullable: false
            },
            address_district: {
                type: 'text',
                nullable: false
            },
            address_detail: {
                type: 'text',
                nullable: false
            },
            is_banned: {
                type: 'boolean',
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
    }
});