export interface Repository {

    fetchAll<T>(repository: string): Promise<T[]>;

    findOne<T>(repository: string, condition: Partial<T>): Promise<T | undefined>;

    save<T>(repository: string, entity: T): Promise<T>;
}
