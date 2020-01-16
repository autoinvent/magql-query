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
    this.url = url

    this.queryBuilder = makeQueryBuilder(schema)
  }

  sendGraphqlRequest (modelName, variables, queryType) {
    const graphQLClient = new GraphQLClient(this.url)
    const query = jsonToGraphQLQuery(
      this.queryBuilder({ modelName, queryType })
    )
    const context = { modelName, query, variables }

    return graphQLClient()
      .request(query, variables)
      .then(data => ({ context, data, error: false }))
      .catch(err => ({ context, data: null, error: err }))
  }
}
