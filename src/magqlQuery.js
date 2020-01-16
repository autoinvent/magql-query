import { makeQueryBuilder } from './queryBuilder'
import { jsonToGraphQLQuery } from 'json-to-graphql-query'
import { GraphQLClient } from 'graphql-request'

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
  constructor (schema, url) {
    this.graphQLClient = new GraphQLClient(url)

    this.queryBuilder = makeQueryBuilder(schema)
  }

  buildQuery (modelName, queryType) {
    this.modelName = modelName

    return jsonToGraphQLQuery(this.queryBuilder({ modelName, queryType }))
  }

  sendRequest (query, variables) {
    const context = { modelName: this.modelName, query, variables }

    return this.graphQLClient
      .request(query, variables)
      .then(data => ({ context, data, error: false }))
      .catch(err => ({ context, data: null, error: err }))
  }

  buildAndSendRequest (modelName, variables, queryType) {
    const query = this.buildQuery(modelName, queryType)

    this.sendRequest(query, variables)
  }
}
