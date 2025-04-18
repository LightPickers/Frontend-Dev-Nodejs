const { dataSource } = require('./db/data-source');
const createApp = require('./app');

const startServer = async() => {
    try {
        await dataSource.initialize();
        console.log('資料庫連線成功');

        const app = createApp();
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('資料庫連線失敗', err);
        process.exit(1);
    };
};

startServer();