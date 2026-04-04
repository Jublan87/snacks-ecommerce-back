/**
 * Interfaz genérica para operaciones CRUD básicas de repositorios.
 *
 * @template T - Tipo del modelo de Prisma (ej: User, Product)
 * @template CreateInput - Tipo de entrada para crear (Prisma.XCreateInput)
 * @template UpdateInput - Tipo de entrada para actualizar (Prisma.XUpdateInput)
 * @template WhereInput - Tipo de condición WHERE (Prisma.XWhereInput)
 * @template Select - Tipo de selección de campos (ej: Prisma.UserSelect). Por defecto object.
 */
export interface IBaseRepository<T, CreateInput, UpdateInput, WhereInput, Select = object> {
  /**
   * Busca un registro por su ID.
   * @param id - ID del registro a buscar
   * @param select - Campos opcionales a seleccionar
   * @returns El registro encontrado o null si no existe
   */
  findById(id: string, select?: Select): Promise<T | null>;

  /**
   * Busca todos los registros que cumplan con los criterios.
   * @param where - Condiciones de búsqueda opcionales
   * @param select - Campos opcionales a seleccionar
   * @returns Array de registros encontrados
   */
  findAll(where?: WhereInput, select?: Select): Promise<T[]>;

  /**
   * Busca un único registro que cumpla con los criterios.
   * @param where - Condiciones de búsqueda
   * @param select - Campos opcionales a seleccionar
   * @returns El registro encontrado o null si no existe
   */
  findOne(where: WhereInput, select?: Select): Promise<T | null>;

  /**
   * Crea un nuevo registro.
   * @param data - Datos del registro a crear
   * @param select - Campos opcionales a seleccionar en la respuesta
   * @returns El registro creado
   */
  create(data: CreateInput, select?: Select): Promise<T>;

  /**
   * Actualiza un registro existente.
   * @param id - ID del registro a actualizar
   * @param data - Datos a actualizar
   * @param select - Campos opcionales a seleccionar en la respuesta
   * @returns El registro actualizado
   */
  update(id: string, data: UpdateInput, select?: Select): Promise<T>;

  /**
   * Elimina un registro por su ID.
   * @param id - ID del registro a eliminar
   * @returns El registro eliminado
   */
  delete(id: string): Promise<T>;

  /**
   * Cuenta el número de registros que cumplen con los criterios.
   * @param where - Condiciones de búsqueda opcionales
   * @returns Número de registros encontrados
   */
  count(where?: WhereInput): Promise<number>;

  /**
   * Verifica si existe un registro con el ID dado.
   * @param id - ID del registro a verificar
   * @returns true si existe, false en caso contrario
   */
  exists(id: string): Promise<boolean>;
}
