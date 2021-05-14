/**
 * ### Queries
 * *"index"* - index page (all instances of a model) \
 * *"detail"* - detail page (single instance of a model) \
 * *"select"* - select field (relationship) \
 * *"tooltip"* - tooltip (single instance of a model) \
 * *"search"* - search (all instances of all models) \
 * *"deleteCascades"* - delete modal (all instances affected by deletion of single instance) \
 * *"selectExistingFields"* - creatable string select field (all existing field values) \
 * ### Mutations
 * *"create"* - create page submit (single instance of a model) \
 * *"update"* - index/detail page save (single instance of a model) \
 * *"delete"* - index/detail page delete (single instance of a model)
 */
export type QueryType =
  | 'index'
  | 'detail'
  | 'select'
  | 'tooltip'
  | 'search'
  | 'deleteCascades'
  | 'selectExistingFields'
  | 'create'
  | 'update'
  | 'delete'

export type RelFieldQueryType =
  | 'indexRelationship'
  | 'detailRelationship'
  | 'selectRelationship'

/**
 * an object type that has the possible GraphQL query variables as its properties
 */
export interface QueryVariables {
  /**
   * {@link QueryType}: *"index"*
   */
  filter?: string
  /**
   * {@link QueryType}: *"index", "select"*
   */
  sort?: string
  /**
   * {@link QueryType}: *"index"*
   */
  page?: string
  /**
   * {@link QueryType}: *"detail", "delete", "tooltip", "update", "deleteCascades"*
   */
  id?: string
  /**
   * {@link QueryType}: *"search"*
   */
  queryString?: string
  /**
   * {@link QueryType}: *"create", "update"*
   */
  input?: string
  /**
   * {@link QueryType}: *"index", "select", "create", "update", "deleteCascades"*
   */
  modelName?: string
}

export type QueryBuilder = ({
  modelName,
  fieldName,
  queryType
}: {
  modelName?: string
  fieldName?: string
  queryType: QueryType
}) => string
