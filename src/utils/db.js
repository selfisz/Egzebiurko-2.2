/**
 * IndexedDB Wrapper - ES6 Module
 * Nowoczesny wrapper dla IndexedDB z Promise API
 */

import { openDB } from 'idb';
import store from '../store/index.js';

const DB_NAME = 'EgzeBiurkoDB';
const DB_VERSION = 3;

/**
 * Definicja schemy bazy danych
 */
const DB_SCHEMA = {
    cases: {
        keyPath: 'id',
        indexes: [
            { name: 'no', keyPath: 'no', unique: false },
            { name: 'date', keyPath: 'date', unique: false },
            { name: 'deadline', keyPath: 'deadline', unique: false },
            { name: 'status', keyPath: 'status', unique: false },
            { name: 'urgent', keyPath: 'urgent', unique: false }
        ]
    },
    garage: {
        keyPath: 'id',
        indexes: [
            { name: 'plates', keyPath: 'plates', unique: false },
            { name: 'vin', keyPath: 'vin', unique: false },
            { name: 'status', keyPath: 'status', unique: false }
        ]
    },
    notes: {
        keyPath: 'id',
        indexes: [
            { name: 'date', keyPath: 'date', unique: false }
        ]
    },
    pdfs: {
        keyPath: 'name',
        indexes: []
    },
    bailiffs: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'nip', keyPath: 'nip', unique: false }
        ]
    },
    attachments: {
        keyPath: 'id',
        indexes: [
            { name: 'caseId', keyPath: 'caseId', unique: false },
            { name: 'date', keyPath: 'date', unique: false }
        ]
    }
};

/**
 * Klasa Database - singleton wrapper dla IndexedDB
 */
class Database {
    constructor() {
        this.db = null;
        this.ready = false;
    }

    /**
     * Inicjalizacja bazy danych
     */
    async init() {
        const startTime = performance.now();

        if (this.ready) return this.db;

        try {
            this.db = await openDB(DB_NAME, DB_VERSION, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    console.log(`[DB] Upgrading from v${oldVersion} to v${newVersion}`);

                    // Utwórz object stores
                    Object.entries(DB_SCHEMA).forEach(([storeName, config]) => {
                        // Usuń stary store jeśli istnieje (tylko podczas upgrade)
                        if (db.objectStoreNames.contains(storeName)) {
                            // Nie usuwaj - zachowaj dane
                        } else {
                            // Utwórz nowy store
                            const store = db.createObjectStore(storeName, {
                                keyPath: config.keyPath,
                                autoIncrement: config.autoIncrement || false
                            });

                            // Dodaj indeksy
                            if (config.indexes) {
                                config.indexes.forEach(index => {
                                    store.createIndex(index.name, index.keyPath, {
                                        unique: index.unique || false
                                    });
                                });
                            }

                            console.log(`[DB] Created store: ${storeName}`);
                        }
                    });
                },
                blocked() {
                    console.warn('[DB] Database upgrade blocked - close other tabs');
                },
                blocking() {
                    console.warn('[DB] This connection is blocking a newer version');
                },
                terminated() {
                    console.error('[DB] Database connection terminated unexpectedly');
                }
            });

            this.ready = true;
            store.commit('SET_DB', this.db);
            console.log('[DB] Database initialized successfully');

            const endTime = performance.now();
            if (endTime - startTime > 3000) {
                console.warn('[DB] Database initialization took longer than 3 seconds');
            }

            return this.db;
        } catch (error) {
            console.error('[DB] Failed to initialize database:', error);
            throw error;
        }
    }

    /**
     * Pobierz wszystkie rekordy z store
     */
    async getAll(storeName) {
        if (!this.ready) await this.init();
        return await this.db.getAll(storeName);
    }

    /**
     * Pobierz rekord po kluczu
     */
    async get(storeName, key) {
        if (!this.ready) await this.init();
        return await this.db.get(storeName, key);
    }

    /**
     * Dodaj rekord
     */
    async add(storeName, data) {
        if (!this.ready) await this.init();
        return await this.db.add(storeName, data);
    }

    /**
     * Zaktualizuj rekord
     */
    async put(storeName, data) {
        if (!this.ready) await this.init();
        return await this.db.put(storeName, data);
    }

    /**
     * Usuń rekord
     */
    async delete(storeName, key) {
        if (!this.ready) await this.init();
        return await this.db.delete(storeName, key);
    }

    /**
     * Wyczyść cały store
     */
    async clear(storeName) {
        if (!this.ready) await this.init();
        return await this.db.clear(storeName);
    }

    /**
     * Pobierz rekordy po indeksie
     */
    async getAllFromIndex(storeName, indexName, query) {
        if (!this.ready) await this.init();
        return await this.db.getAllFromIndex(storeName, indexName, query);
    }

    /**
     * Zlicz rekordy w store
     */
    async count(storeName) {
        if (!this.ready) await this.init();
        return await this.db.count(storeName);
    }

    /**
     * Transakcja (dla zaawansowanych operacji)
     */
    async transaction(storeNames, mode = 'readonly') {
        if (!this.ready) await this.init();
        return this.db.transaction(storeNames, mode);
    }

    /**
     * Export całej bazy do JSON
     */
    async exportAll() {
        if (!this.ready) await this.init();

        const data = {};
        const storeNames = Object.keys(DB_SCHEMA);

        for (const storeName of storeNames) {
            try {
                data[storeName] = await this.getAll(storeName);
            } catch (error) {
                console.error(`[DB] Error exporting ${storeName}:`, error);
                data[storeName] = [];
            }
        }

        return data;
    }

    /**
     * Import danych z JSON
     */
    async importAll(data) {
        if (!this.ready) await this.init();

        const results = {};

        for (const [storeName, records] of Object.entries(data)) {
            if (!DB_SCHEMA[storeName]) {
                console.warn(`[DB] Unknown store: ${storeName}, skipping`);
                continue;
            }

            try {
                // Wyczyść store
                await this.clear(storeName);

                // Dodaj rekordy
                let imported = 0;
                for (const record of records) {
                    await this.add(storeName, record);
                    imported++;
                }

                results[storeName] = { success: true, count: imported };
                console.log(`[DB] Imported ${imported} records to ${storeName}`);
            } catch (error) {
                console.error(`[DB] Error importing ${storeName}:`, error);
                results[storeName] = { success: false, error: error.message };
            }
        }

        return results;
    }

    /**
     * Backup bazy do pliku
     */
    async backup() {
        const data = await this.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `egzebiurko-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('[DB] Backup created successfully');
        return true;
    }

    /**
     * Restore z pliku
     */
    async restore(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const results = await this.importAll(data);
                    console.log('[DB] Restore completed:', results);
                    resolve(results);
                } catch (error) {
                    console.error('[DB] Restore failed:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Zamknij połączenie z bazą
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.ready = false;
            console.log('[DB] Database connection closed');
        }
    }
}

// Export singleton instance
const db = new Database();
export default db;
export { Database, DB_NAME, DB_VERSION, DB_SCHEMA };
