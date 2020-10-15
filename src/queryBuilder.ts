import * as R from 'ramda'
import { VariableType } from 'json-to-graphql-query'
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

export enum QueryType {
  INDEX = 'index',
  DETAIL = 'detail',
  SELECT = 'select',
  TOOLTIP = 'tooltip',
  INDEX_REL = 'indexRelationship',
  DETAIL_REL = 'detailRelationship',
  SELECT_REL = 'selectRelationship',
  SEARCH = 'search',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  DELETE_CASCADES = 'deleteCascades'
}

interface QueryObject {
  [k: string]: true | QueryObject
}

const getRequiredFields = (model: any) =>
  R.union(['__typeName', 'id'], R.pathOr([], ['queryRequired'], model))

const getRelTableFields = ({
  fieldName,
  model
}: {
  fieldName: string
  model: any
}) => R.pathOr([], ['fields', fieldName, 'type', 'tableFields'], model)

const getQueryName = (
  schema: SchemaBuilder,
  modelName: string,
  queryType: QueryType
) => {
  const model: any = schema.getModel(modelName)
  switch (queryType) {
    case QueryType.INDEX:
    case QueryType.SELECT:
      return model.queryAllName
    case QueryType.DETAIL:
    case QueryType.TOOLTIP:
      return model.queryName
    case QueryType.CREATE:
    case QueryType.UPDATE:
    case QueryType.DELETE:
      return model.queryName
    default:
      return queryType
  }
}

const getSortVariable = (modelName: string) => `${modelName}Sort`

const getListVariables = (modelName: string) => ({
  filter: `${modelName}Filter`,
  sort: `[${getSortVariable(modelName)}!]`,
  page: 'Page'
})

const detailVariables = {
  id: 'Int!'
}

const getVariables = ({
  modelName,
  queryType
}: {
  modelName: string
  queryType: QueryType
}) => {
  switch (queryType) {
    case QueryType.INDEX:
      return getListVariables(modelName)
    case QueryType.DELETE:
    case QueryType.DETAIL:
    case QueryType.TOOLTIP:
      return detailVariables
    case QueryType.SELECT:
      return { sort: `[${getSortVariable(modelName)}!]` }
    case QueryType.SEARCH:
      return { queryString: 'String!' }
    case QueryType.CREATE:
      return { input: `${modelName}InputRequired!` }
    case QueryType.UPDATE:
      return { input: `${modelName}Input!`, id: 'Int!' }
    case QueryType.DELETE_CASCADES:
      return { modelName: 'String!', id: 'Int!' }
  }
}

const getArgs = (queryType: QueryType) => {
  switch (queryType) {
    case QueryType.INDEX:
      return {
        filter: new VariableType('filter'),
        sort: new VariableType('sort'),
        page: new VariableType('page')
      }
    case QueryType.DELETE:
    case QueryType.DETAIL:
    case QueryType.TOOLTIP:
      return { id: new VariableType('id') }
    case QueryType.SELECT:
      return { sort: new VariableType('sort') }
    case QueryType.SEARCH:
      return { queryString: new VariableType('queryString') }
    case QueryType.CREATE:
      return { input: new VariableType('input') }
    case QueryType.UPDATE:
      return { input: new VariableType('input'), id: new VariableType('id') }
    case QueryType.DELETE_CASCADES:
      return {
        tableName: new VariableType('modelName'),
        id: new VariableType('id')
      }
  }
}

const getFieldQueryType = (queryType: QueryType) => {
  switch (queryType) {
    case QueryType.INDEX:
      return QueryType.INDEX_REL
    case QueryType.DETAIL:
      return QueryType.DETAIL_REL
    case QueryType.SELECT:
      return QueryType.SELECT_REL
    default:
      return queryType
  }
}

const getQueryIndexFields = (schema: any, modelName: string) => {
  const indexFields = schema.getIndexFields({ modelName, customProps: {} })
  const fields = R.pipe(
    R.prop<string, any>('fields'),
    R.map(
      (field: any) =>
        R.includes(R.prop('fieldName', field), indexFields) ||
        R.prop('queryIndex', field)
    )
  )(schema.getModel(modelName))
  return R.filter(R.identity, fields)
}

const getQueryDetailFields = (schema: any, modelName: any) => {
  const fields = R.filter(
    (field: any) =>
      (R.propOr(true, 'showDetail', field) || R.prop('queryDetail', field)) &&
      !R.prop('virtualField', field),
    schema.getFields(modelName)
  )
  const model = schema.getModel(modelName)
  return R.mapObjIndexed((val, key) => {
    const show =
      R.pathOr(true, ['fields', key, 'showDetail'], model) ||
      R.path(['fields', key, 'queryDetail'], model)
    return R.pathOr(show, ['fields', key, 'type', 'type'], model)
  }, fields)
}
// needs to be removed?
const makeRelayNodeConnection = (nodeQueryObj: any) => ({
  __typename: true,
  ...nodeQueryObj
})

const getRelFieldObject = ({
  schema,
  modelName,
  fieldName
}: {
  schema: SchemaBuilder
  modelName: string
  fieldName: string
}) => {
  const relFieldObject: QueryObject = {
    id: true
  }
  const targetModel = R.path(
    ['type', 'target'],
    schema.getField(modelName, fieldName)
  ) as string
  const targetModelDisplayField = R.propOr(
    'name',
    'displayField',
    schema.getModel(targetModel)
  ) as string
  if (targetModelDisplayField) {
    relFieldObject[targetModelDisplayField] = true
  } // todo: targetModelDisplayField can be function and not string???
  return relFieldObject
}

const buildTooltipFieldsObject = ({
  schema,
  modelName
}: {
  schema: SchemaBuilder
  modelName: string
}) => {
  // todo: insert customProps from outside application
  const fields = schema.getTooltipFields({ modelName, customProps: {} })
  return R.pipe(
    R.reduce((accumulator, fieldName: string) => {
      const type = schema.getType(modelName, fieldName)
      if (type.includes('ToMany')) {
        return R.assoc(
          fieldName,
          makeRelayNodeConnection(
            getRelFieldObject({ schema, modelName, fieldName })
          ),
          accumulator
        )
      } else if (type.includes('ToOne')) {
        return R.assoc(
          fieldName,
          getRelFieldObject({ schema, modelName, fieldName }),
          accumulator
        )
      } else {
        return R.assoc(fieldName, true, accumulator)
      }
    }, {})
  )(fields)
}

const pickFields = (arr: string[], fields: any): object =>
  R.pickBy((val, key) => R.includes(key, arr), fields)

const buildFieldsObject = ({
  schema,
  queryType,
  modelName,
  queryFields = []
}: {
  schema: SchemaBuilder
  queryType: QueryType
  modelName: string
  queryFields?: string[]
}) => {
  const model = schema.getModel(modelName)
  const required = getRequiredFields(model)
  const requiredObj = required.reduce(
    (acc, val) => ({ ...acc, [val]: true }),
    {}
  )

  if (queryType === QueryType.TOOLTIP) {
    return buildTooltipFieldsObject({ schema, modelName })
  }

  let fields = ((): object => {
    switch (queryType) {
      case QueryType.INDEX:
        return getQueryIndexFields(schema, modelName)
      case QueryType.DETAIL:
        return getQueryDetailFields(schema, modelName)
      case QueryType.DETAIL_REL:
        return pickFields(queryFields, getQueryDetailFields(schema, modelName))
      default:
        return {}
    }
  })()
  fields = R.mergeDeepLeft(requiredObj, fields)
  // replace with query object when fieldName is Relationship type
  fields = R.mapObjIndexed((val, key) => {
    const field = schema.getField(modelName, key)
    if (!schema.isRel(modelName, key)) {
      return val
    }

    return buildFieldsObject({
      schema,
      queryType: getFieldQueryType(queryType),
      modelName: R.path(['type', 'target'], field) as string,
      queryFields: getRelTableFields({ model, fieldName: key })
    })
  }, fields)

  return fields
}

const buildSearchFieldsArray = (schema: SchemaBuilder) => {
  const fieldsArray: object[] = []
  R.forEachObjIndexed(model => {
    if (schema.getSearchable(model.modelName)) {
      fieldsArray.push(buildSearchFieldsObject(schema, model))
    }
  }, schema.schemaJSON)
  return fieldsArray
}

const buildSearchFieldsObject = (schema: SchemaBuilder, model: any) => {
  const required = getRequiredFields(model)
  const requiredObj = required.reduce(
    (acc, val) => ({ ...acc, [val]: true }),
    {}
  )

  let fields: QueryObject = {}
  fields.id = true
  if (R.type(model.displayField) === 'String') {
    fields[model.displayField] = true
  }

  fields = R.mergeDeepLeft(requiredObj, fields)

  fields.__typeName = model.modelName

  fields = R.mapObjIndexed((val, key) => {
    const field = schema.getField(model.modelName, key)
    if (!schema.isRel(model.modelName, key)) {
      return val
    }

    return buildSearchFieldsObject(
      schema,
      schema.getModel(R.path(['type', 'target'], field) as string)
    )
  }, fields)

  return fields
}

const buildDeleteCascadesArray = (schema: SchemaBuilder) => {
  const cascadesArray: object[] = []
  R.forEachObjIndexed(model => {
    cascadesArray.push(buildCascadesObject(schema, model))
  }, schema.schemaJSON)
  return cascadesArray
}

const buildCascadesObject = (schema: SchemaBuilder, model: any) => {
  const required = getRequiredFields(model)
  const requiredObj = required.reduce(
    (acc, val) => ({ ...acc, [val]: true }),
    {}
  )

  let cascades: QueryObject = {}
  cascades.__typename = true
  cascades.id = true
  if (R.type(model.displayField) === 'String') {
    cascades[model.displayField] = true
  }

  cascades = R.mergeDeepLeft(requiredObj, cascades)

  cascades.__typeName = model.modelName

  cascades = R.mapObjIndexed((val, key) => {
    const field = schema.getField(model.modelName, key)
    if (!schema.isRel(model.modelName, key)) {
      return val
    }

    return buildCascadesObject(
      schema,
      schema.getModel(R.path(['type', 'target'], field) as string)
    )
  }, cascades)

  return cascades
}

export const makeQueryBuilder = (schema: SchemaBuilder) => {
  return ({
    modelName,
    queryType = QueryType.INDEX
  }: {
    modelName: string
    queryType: QueryType
  }) => {
    const queryName = getQueryName(schema, modelName, queryType)
    const queryVariables = getVariables({ modelName, queryType })

    switch (queryType) {
      case QueryType.INDEX:
      case QueryType.DETAIL:
      case QueryType.SELECT:
      case QueryType.TOOLTIP:
        return {
          query: {
            __variables: queryVariables,
            [queryName]: {
              __args: getArgs(queryType),
              result: {
                ...buildFieldsObject({ schema, modelName, queryType })
              },
              errors: true,
              count: queryType === QueryType.INDEX
            }
          }
        }
      case QueryType.SEARCH:
        return {
          query: {
            __variables: queryVariables,
            search: {
              __args: getArgs(queryType),
              __typename: true,
              __on: buildSearchFieldsArray(schema)
            }
          }
        }
      case QueryType.CREATE:
      case QueryType.UPDATE:
      case QueryType.DELETE:
        return {
          mutation: {
            __variables: queryVariables,
            [`${queryType}${modelName}`]: {
              __args: getArgs(queryType),
              result: {
                __typename: true,
                id: true
              },
              errors: true
            }
          }
        }
      case QueryType.DELETE_CASCADES:
        return {
          query: {
            __variables: queryVariables,
            checkDelete: {
              __args: getArgs(queryType),
              __on: buildDeleteCascadesArray(schema)
            }
          }
        }
    }
  }
}
