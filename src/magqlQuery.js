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
  constructor({ schema, url }) {
    this.endpoint = url
    this.graphQLClient = new GraphQLClient(url)
    this.queryBuilder = makeQueryBuilder(schema)
  }

  buildQuery({ modelName, queryType }) {
    return jsonToGraphQLQuery(this.queryBuilder({ modelName, queryType }))
  }

  sendRequest({ query, variables, formData }) {
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

  buildAndSendRequest({ modelName, variables, queryType }) {
    const query = this.buildQuery({ modelName, queryType })

    return this.sendRequest({ query, variables })
  }
}
