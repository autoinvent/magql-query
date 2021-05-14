import makeQueryBuilder from './queryBuilder'
import { GraphQLClient } from 'graphql-request'
import { SchemaBuilder } from '@autoinvent/conveyor-schema'
import { QueryBuilder, QueryType, QueryVariables } from './types'

/**
 * A class for building and sending queries to a [magql](https://github.com/autoinvent/magql)-generated GraphQL API.
 * ```typescript
 * import { MagqlQuery } from '@autoinvent/magql-query'
 * ⠀
 * const magqlQuery = new MagqlQuery({ schema, endpoint })
 * ⠀
 * const query = magqlQuery.buildQuery({ modelName, fieldName, queryType })
 * ⠀
 * magqlQuery.sendRequest({ query, variables })
 * OR
 * magqlQuery.sendRequest({ formData })
 * ⠀
 * magqlQuery.buildAndSendRequest({ modelName, fieldName, variables, queryType })
 * ```
 */
class MagqlQuery {
  /** the GraphQL endpoint url */
  endpoint: string
  /**
   * the client used for making requests to the GraphQL server \
   * [graphql-request](https://github.com/prisma-labs/graphql-request)
   */
  graphQLClient: GraphQLClient
  /**
   * the function which builds the GraphQL query string
   */
  queryBuilder: QueryBuilder

  /**
   * Creates a MagqlQuery object used for building and sending queries.
   * @param schema the [conveyor-schema](https://github.com/autoinvent/conveyor-schema) SchemaBuilder object
   * @param url the GraphQL endpoint
   */
  constructor({ schema, url }: { schema: SchemaBuilder; url: string }) {
    this.endpoint = url
    this.graphQLClient = new GraphQLClient(url)
    this.queryBuilder = makeQueryBuilder(schema)
  }

  /**
   * Builds a [magql](https://github.com/autoinvent/magql) compatible GraphQL query string
   * @param modelName the name of the model
   * > 📝 Not required for *search* and *deleteCascades* query types
   * @param fieldName the name of the field
   * > 📝 Only required for *selectExistingField* query type
   * @param queryType the type of the query to build
   * @returns the built GraphQL query string
   */
  buildQuery({
    modelName,
    fieldName,
    queryType
  }: {
    modelName?: string
    fieldName?: string
    queryType: QueryType
  }): string {
    return this.queryBuilder({ modelName, fieldName, queryType })
  }

  /**
   * Sends a query or a file as a request to the GraphQL server
   * @param variables the variables to pass with the GraphQL query
   * @param query the query for the GraphQL server
   * @param formData the form-data to POST to the GraphQL server
   * @returns a Promise object that represents the response of the GraphQL server
   */
  sendRequest({
    query,
    variables,
    formData
  }: {
    query?: string
    variables?: QueryVariables
    formData?: string
  }): Promise<
    | {
        data: unknown
        error: boolean
      }
    | {
        data: null
        error: unknown
      }
  > {
    if (formData || !query) {
      const request = new Request(this.endpoint)
      const init = {
        method: 'POST',
        body: formData
      }
      return fetch(request, init)
        .then((data) => ({ data, error: false }))
        .catch((err) => ({ data: null, error: err }))
    }
    return this.graphQLClient
      .request(query, variables)
      .then((data) => ({ data: Object.values(data)[0], error: false }))
      .catch((err) => ({ data: null, error: err }))
  }

  /**
   * Builds a [magql](https://github.com/autoinvent/magql) compatible GraphQL query string
   * and sends it as a request to the GraphQL server.
   * @param modelName the name of the model
   * > 📝 Not required for *search* and *deleteCascades* query types
   * @param fieldName the name of the field
   * > 📝 Only required for *selectExistingField* query type
   * @param variables the variables to pass with the GraphQL query
   * @param queryType the type of the query to build
   * @returns a Promise object that represents the response of the GraphQL server
   */
  buildAndSendRequest({
    modelName,
    fieldName,
    variables,
    queryType
  }: {
    modelName?: string
    fieldName?: string
    variables: QueryVariables
    queryType: QueryType
  }): Promise<
    | {
        data: unknown
        error: boolean
      }
    | {
        data: null
        error: unknown
      }
  > {
    const query = this.buildQuery({ modelName, fieldName, queryType })

    return this.sendRequest({ query, variables })
  }
}

export default MagqlQuery
