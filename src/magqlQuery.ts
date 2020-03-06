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
  queryBuilder: any

  constructor({ schema, url }: { schema: SchemaBuilder; url: string }) {
    this.endpoint = url
    this.graphQLClient = new GraphQLClient(url)
    this.queryBuilder = makeQueryBuilder(schema)
  }

  buildQuery({
    modelName,
    queryType
  }: {
    modelName: string
    queryType: QueryType
  }) {
    return jsonToGraphQLQuery(this.queryBuilder({ modelName, queryType }))
  }

  sendRequest({
    query,
    variables,
    formData
  }: {
    query: string
    variables: object
    formData?: any
  }) {
    if (formData) {
      const request = new Request(this.endpoint)
      const init = {
        method: 'POST',
        body: formData
      }
      return fetch(request, init)
        .then(data => ({ data, error: false }))
        .catch(err => ({ data: null, error: err }))
    }

    return this.graphQLClient
      .request(query, variables)
      .then(data => ({ data, error: false }))
      .catch(err => ({ data: null, error: err }))
  }

  buildAndSendRequest({
    modelName,
    variables,
    queryType
  }: {
    modelName: string
    variables: object
    queryType: QueryType
  }) {
    const query = this.buildQuery({ modelName, queryType })

    return this.sendRequest({ query, variables })
  }
}
