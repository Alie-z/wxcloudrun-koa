const {Sequelize, DataTypes} = require('sequelize');

// 从环境变量中读取数据库配置
let {
    MYSQL_USERNAME = 'root',
    MYSQL_PASSWORD = '1234qwer!!!',
    MYSQL_ADDRESS = 'sh-cynosdbmysql-grp-g9tsr7by.sql.tencentcdb.com:22028'
} = process.env;
(MYSQL_USERNAME = 'root'),
    (MYSQL_PASSWORD = '1234qwer!!!'),
    (MYSQL_ADDRESS = 'sh-cynosdbmysql-grp-g9tsr7by.sql.tencentcdb.com:22028');
const [host, port] = MYSQL_ADDRESS.split(':');
console.log('🚀 > MYSQL_USERNAME', MYSQL_USERNAME, MYSQL_PASSWORD, host, port);

const sequelize = new Sequelize('nodejs_demo', MYSQL_USERNAME, MYSQL_PASSWORD, {
    host,
    port,
    dialect: 'mysql' /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
});

// 定义数据模型
const Counter = sequelize.define('Counter', {
    count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2
    }
});

// 数据库初始化方法
async function init() {
    await Counter.sync({alter: true});
}

// 导出初始化方法和模型
module.exports = {
    init,
    Counter
};
