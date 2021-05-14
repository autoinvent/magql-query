A class for building and sending queries to a [magql](https://github.com/autoinvent/magql)-generated GraphQL API.
```typescript
import { MagqlQuery } from '@autoinvent/magql-query'
⠀
const magqlQuery = new MagqlQuery({ schema, endpoint })
⠀
const query = magqlQuery.buildQuery({ modelName, fieldName, queryType })
⠀
magqlQuery.sendRequest({ query, variables })
OR
magqlQuery.sendRequest({ formData, variables })
⠀
magqlQuery.buildAndSendRequest({ modelName, fieldName, variables, queryType })
```

## Table of contents

### Constructors

- [constructor](../wiki/Class:%20MagqlQuery#constructor)

### Properties

- [endpoint](../wiki/Class:%20MagqlQuery#endpoint)
- [graphQLClient](../wiki/Class:%20MagqlQuery#graphqlclient)
- [queryBuilder](../wiki/Class:%20MagqlQuery#querybuilder)

### Methods

- [buildAndSendRequest](../wiki/Class:%20MagqlQuery#buildandsendrequest)
- [buildQuery](../wiki/Class:%20MagqlQuery#buildquery)
- [sendRequest](../wiki/Class:%20MagqlQuery#sendrequest)

## Constructors

### constructor

\+ **new MagqlQuery**(`__namedParameters`: { `schema`: *SchemaBuilder* ; `url`: *string*  }): [*MagqlQuery*](../wiki/Class:%20MagqlQuery)

Creates a MagqlQuery object used for building and sending queries.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `__namedParameters` | *object* | - |
| `__namedParameters.schema` | *SchemaBuilder* | the [conveyor-schema](https://github.com/autoinvent/conveyor-schema) SchemaBuilder object |
| `__namedParameters.url` | *string* | the GraphQL endpoint |

**Returns:** [*MagqlQuery*](../wiki/Class:%20MagqlQuery)

Defined in: [magqlQuery.ts:33](https://github.com/autoinvent/magql-query/blob/3443b6a/src/magqlQuery.ts#L33)

## Properties

### endpoint

• **endpoint**: *string*

the GraphQL endpoint url

Defined in: [magqlQuery.ts:24](https://github.com/autoinvent/magql-query/blob/3443b6a/src/magqlQuery.ts#L24)

___

### graphQLClient

• **graphQLClient**: *GraphQLClient*

the client used for making requests to the GraphQL server \
[graphql-request](https://github.com/prisma-labs/graphql-request)

Defined in: [magqlQuery.ts:29](https://github.com/autoinvent/magql-query/blob/3443b6a/src/magqlQuery.ts#L29)

___

### queryBuilder

• **queryBuilder**: QueryBuilder

the function which builds the GraphQL query string

Defined in: [magqlQuery.ts:33](https://github.com/autoinvent/magql-query/blob/3443b6a/src/magqlQuery.ts#L33)

## Methods

### buildAndSendRequest

▸ **buildAndSendRequest**(`__namedParameters`: { `fieldName?`: *string* ; `modelName?`: *string* ; `queryType`: [*QueryType*](../wiki/Exports#querytype) ; `variables`: [*QueryVariables*](../wiki/Interface:%20QueryVariables)  }): *Promise*<{ `data`: *unknown* ; `error`: *boolean*  } \| { `data`: ``null`` ; `error`: *unknown*  }\>

Builds a [magql](https://github.com/autoinvent/magql) compatible GraphQL query string
and sends it as a request to the GraphQL server.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `__namedParameters` | *object* | - |
| `__namedParameters.fieldName?` | *string* | the name of the field > 📝 Only required for *selectExistingField* query type |
| `__namedParameters.modelName?` | *string* | the name of the model > 📝 Not required for *search* and *deleteCascades* query types |
| `__namedParameters.queryType` | [*QueryType*](../wiki/Exports#querytype) | the type of the query to build |
| `__namedParameters.variables` | [*QueryVariables*](../wiki/Interface:%20QueryVariables) | the variables to pass with the GraphQL query |

**Returns:** *Promise*<{ `data`: *unknown* ; `error`: *boolean*  } \| { `data`: ``null`` ; `error`: *unknown*  }\>

a Promise object that represents the response of the GraphQL server

Defined in: [magqlQuery.ts:119](https://github.com/autoinvent/magql-query/blob/3443b6a/src/magqlQuery.ts#L119)

___

### buildQuery

▸ **buildQuery**(`__namedParameters`: { `fieldName?`: *string* ; `modelName?`: *string* ; `queryType`: [*QueryType*](../wiki/Exports#querytype)  }): *string*

Builds a [magql](https://github.com/autoinvent/magql) compatible GraphQL query string

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `__namedParameters` | *object* | - |
| `__namedParameters.fieldName?` | *string* | the name of the field > 📝 Only required for *selectExistingField* query type |
| `__namedParameters.modelName?` | *string* | the name of the model > 📝 Not required for *search* and *deleteCascades* query types |
| `__namedParameters.queryType` | [*QueryType*](../wiki/Exports#querytype) | the type of the query to build |

**Returns:** *string*

the built GraphQL query string

Defined in: [magqlQuery.ts:55](https://github.com/autoinvent/magql-query/blob/3443b6a/src/magqlQuery.ts#L55)

___

### sendRequest

▸ **sendRequest**(`__namedParameters`: { `formData?`: *string* ; `query?`: *string* ; `variables`: [*QueryVariables*](../wiki/Interface:%20QueryVariables)  }): *Promise*<{ `data`: *unknown* ; `error`: *boolean*  } \| { `data`: ``null`` ; `error`: *unknown*  }\>

Sends a query or a file as a request to the GraphQL server

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `__namedParameters` | *object* | - |
| `__namedParameters.formData?` | *string* | the form-data to POST to the GraphQL server |
| `__namedParameters.query?` | *string* | the query for the GraphQL server |
| `__namedParameters.variables` | [*QueryVariables*](../wiki/Interface:%20QueryVariables) | the variables to pass with the GraphQL query |

**Returns:** *Promise*<{ `data`: *unknown* ; `error`: *boolean*  } \| { `data`: ``null`` ; `error`: *unknown*  }\>

a Promise object that represents the response of the GraphQL server

Defined in: [magqlQuery.ts:74](https://github.com/autoinvent/magql-query/blob/3443b6a/src/magqlQuery.ts#L74)
