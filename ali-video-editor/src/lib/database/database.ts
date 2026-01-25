/**
 * Database Connection Singleton
 *
 * Manages SQLite database connection using better-sqlite3
 * Handles initialization, migrations, and connection lifecycle
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { logger } from "../logger";

// ============================================================================
// Constants
// ============================================================================

const DB_FILENAME = "history.db";
const DB_DIR_NAME = ".videocopilot";

// ============================================================================
// Database Connection Class
// ============================================================================

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database.Database | null = null;
  private dbPath: string | null = null;

  private constructor() {
    logger.info("DatabaseConnection singleton created");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Initialize database connection and run migrations
   */
  public initialize(): void {
    if (this.db) {
      logger.warn("Database already initialized");
      return;
    }

    const dbPath = this.getDbPath();

    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      logger.info("Created database directory", { dbDir });
    }

    try {
      // Open database with WAL mode for better concurrent access
      this.db = new Database(dbPath);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("foreign_keys = ON");

      // Run migrations
      this.runMigrations();

      this.dbPath = dbPath;

      logger.info("Database initialized", { dbPath });
    } catch (error) {
      logger.error("Failed to initialize database", {
        dbPath,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get database path based on environment
   */
  private getDbPath(): string {
    // For Next.js/React app, use project root data directory
    const baseDir = path.join(process.cwd(), DB_DIR_NAME, "data");
    return path.join(baseDir, DB_FILENAME);
  }

  /**
   * Run all migration files
   */
  private runMigrations(): void {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const migrationsDir = path.join(__dirname, "migrations");

      // Check if migrations directory exists
      if (!fs.existsSync(migrationsDir)) {
        logger.warn("Migrations directory not found", { migrationsDir });
        return;
      }

      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

      logger.info("Running migrations", {
        count: migrationFiles.length,
        migrations: migrationFiles,
      });

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf-8");

        try {
          this.db.exec(sql);
          logger.debug("Migration executed", { file });
        } catch (error) {
          logger.error("Migration failed", {
            file,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      }

      logger.info("All migrations completed successfully");
    } catch (error) {
      logger.error("Failed to run migrations", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get database instance
   */
  public getDb(): Database.Database {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  /**
   * Get database path
   */
  public getPath(): string | null {
    return this.dbPath;
  }

  /**
   * Check if database is initialized
   */
  public isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        this.dbPath = null;
        logger.info("Database connection closed");
      } catch (error) {
        logger.error("Failed to close database", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export const database = DatabaseConnection.getInstance();
export default database;
