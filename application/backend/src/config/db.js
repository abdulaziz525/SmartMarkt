"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbType = exports.db = void 0;
var knex_1 = require("knex");
var dotenv_1 = require("dotenv");
var path_1 = require("path");
var url_1 = require("url");
dotenv_1.default.config();
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var dbType = (process.env.DB_TYPE || 'postgres').toLowerCase();
exports.dbType = dbType;
var config;
if (dbType === 'sqlite') {
    config = {
        client: 'sqlite3',
        connection: {
            filename: path_1.default.resolve(__dirname, '../../', process.env.DB_NAME || 'database.sqlite'),
        },
        useNullAsDefault: true,
    };
}
else {
    config = {
        client: dbType === 'mysql' ? 'mysql2' : 'pg',
        connection: {
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || (dbType === 'mysql' ? 'root' : 'postgres'),
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartmarkt',
            port: Number(process.env.DB_PORT) || (dbType === 'mysql' ? 3306 : 5432),
        },
        useNullAsDefault: true,
    };
}
exports.db = (0, knex_1.default)(config);
