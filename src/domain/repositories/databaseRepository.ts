export interface IDatabaseRepository<T> {
  findById(id: string): Promise<T | null>;
  save(data: T): Promise<void>;
  update(data: T): Promise<T>;
}
