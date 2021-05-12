import { makeQueryBuilder, QueryType } from './queryBuilder'
import { jsonToGraphQLQuery } from 'json-to-graphql-query'
import { GraphQLClient } from 'graphql-request'
import { SchemaBuilder } from '@autoinvent/conveyor-schema'

/*
create
edit
index
select
detail
tooltip
check_delete
delete
search
*/

export class MagqlQuery {
  endpoint: string
  graphQLClient: GraphQLClient
  queryBuilder: Function

  constructor({ schema, url }: { schema: SchemaBuilder; url: string }) {
    this.endpoint = url
    this.graphQLClient = new GraphQLClient(url)
    this.queryBuilder = makeQueryBuilder(schema)
  }

  buildQuery({
    modelName,
    fieldName,
    queryType
  }: {
    modelName?: string
    fieldName?: string
    queryType: QueryType
  }): string {
    const result = this.queryBuilder({ modelName, fieldName, queryType })
    if (typeof result === 'string') {
      return this.queryBuilder({ modelName, fieldName, queryType })
    } else {
      return jsonToGraphQLQuery(
        this.queryBuilder({ modelName, fieldName, queryType })
      )
    }
  }

  sendRequest({
    query,
    variables,
    formData
  }: {
    query: string
    variables: object
    formData?: string
  }): object {
    if (formData) {
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

  buildAndSendRequest({
    modelName,
    variables,
    queryType
  }: {
    modelName: string
    variables: object
    queryType: QueryType
  }): object {
    const query = this.buildQuery({ modelName, queryType })

    return this.sendRequest({ query, variables })
  }
}
