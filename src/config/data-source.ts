import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

// Load .env file explicitly for standalone scripts
// ConfigService doesn't auto-load .env in standalone mode
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts
          .join('=')
          .trim()
          .replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    }
  });
}

// DataSource configuration for migrations and CLI
const configService = new ConfigService();

// DB_PASSWORD may legitimately be empty when Postgres is configured with trust
// auth on localhost, so don't hard-fail; just default to an empty string.
const dbPassword = configService.get<string>('DB_PASSWORD') ?? '';

const dbHost = configService.get<string>('DB_HOST', 'localhost');
const dbUser = configService.get<string>('DB_USER') || configService.get<string>('DB_USERNAME', 'myuser');

// AWS RDS requires SSL connection
// Enable SSL if connecting to AWS RDS or in production
const isAwsRds = dbHost.includes('.rds.amazonaws.com');
const isProduction = configService.get<string>('NODE_ENV') === 'production';
const enableSSL = isAwsRds || isProduction;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: configService.get<number>('DB_PORT', 5432),
  username: dbUser,
  password: dbPassword,
  database: configService.get<string>('DB_NAME', 'mydatabase'),
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false, // Never use synchronize with migrations
  logging: configService.get<string>('NODE_ENV') === 'development',
  ssl: enableSSL ? { rejectUnauthorized: false } : false,
});
