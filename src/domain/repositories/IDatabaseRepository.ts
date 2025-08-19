export interface IDatabaseRepository<T>{
    findById(id: string): Promise<T>
    // findAll()
    save(dto: T) : Promise<void>;
}