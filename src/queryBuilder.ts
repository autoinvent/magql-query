import * as R from 'ramda'
import { VariableType } from 'json-to-graphql-query'
import { SchemaBuilder } from '@autoinvent/conveyor-schema'
import {
  Field,
  FieldTypeObject,
  Schema
} from '@autoinvent/conveyor-schema/lib/schemaJson'

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
  DELETE_CASCADES = 'deleteCascades',
  SELECT_EXISTING_FIELDS = 'selectExistingFields'
}

interface QueryObject {
  [k: string]: string | boolean | QueryObject
}

const getRequiredFields = (model: Schema): string[] =>
  R.union(['__typeName', 'id'], R.pathOr([], ['queryRequired'], model))

const getRelTableFields = ({
  fieldName,
  model
}: {
  fieldName: string
  model: Schema
}): string[] => {
  const fieldType = model.fields?.[fieldName]?.type as FieldTypeObject
  return fieldType?.tableFields ?? []
}

const getQueryName = (
  schema: SchemaBuilder,
  modelName: string,
  queryType: QueryType
): string | undefined => {
  const model = schema.getModel(modelName)
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

const getSortVariable = (modelName: string): string => `${modelName}Sort`

const getListVariables = (modelName: string): object => ({
  filter: `${modelName}Filter`,
  sort: `[${getSortVariable(modelName)}!]`,
  page: 'Page'
})

const detailVariables = {
  id: 'ID!'
}

const getVariables = ({
  modelName,
  queryType
}: {
  modelName: string
  queryType: QueryType
}): object => {
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
      return { input: `${modelName}Input!`, id: 'ID!' }
    case QueryType.DELETE_CASCADES:
      return { modelName: 'String!', id: 'ID!' }
    default:
      return { queryType: 'defaultQueryType' }
  }
}

const getArgs = (queryType: QueryType): object => {
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
    default:
      return { queryType: 'defaultQueryType' }
  }
}

const getFieldQueryType = (queryType: QueryType): QueryType => {
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

const getQueryIndexFields = (
  schema: SchemaBuilder,
  modelName: string
): object => {
  const indexFields: string[] = schema.getIndexFields({
    modelName,
    customProps: {}
  })
  const fields = R.pipe(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    R.prop<string, any>('fields'),
    R.map(
      (field: Field) =>
        R.includes(R.prop('fieldName', field), indexFields) ||
        R.prop('queryIndex', field)
    )
  )(schema.getModel(modelName)) as boolean[]
  return R.filter(R.identity, fields)
}

const getQueryDetailFields = (
  schema: SchemaBuilder,
  modelName: string
): object => {
  const fields = R.filter(
    (field: Field) =>
      ((R.propOr(true, 'showDetail', field) ||
        R.prop('queryDetail', field)) as boolean) &&
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
const makeRelayNodeConnection = (nodeQueryObj: object): object => ({
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
}): object => {
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
  )
  if (typeof targetModelDisplayField === 'function') {
    relFieldObject[targetModelDisplayField()] = true
  } else if (typeof targetModelDisplayField === 'string') {
    relFieldObject[targetModelDisplayField] = true
  }
  return relFieldObject
}

const buildTooltipFieldsObject = ({
  schema,
  modelName
}: {
  schema: SchemaBuilder
  modelName: string
}): object => {
  // todo: insert customProps from outside application
  const fields = schema.getTooltipFields({
    modelName,
    customProps: {}
  }) as string[]
  return R.pipe(
    R.reduce((accumulator, fieldName: string) => {
      const type = schema.getType(modelName, fieldName) as string
      if (type && type.includes('ToMany')) {
        return R.assoc(
          fieldName,
          makeRelayNodeConnection(
            getRelFieldObject({ schema, modelName, fieldName })
          ),
          accumulator
        )
      } else if (type && type.includes('ToOne')) {
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

const pickFields = (arr: string[], fields: object): object =>
  R.pickBy((_val, key) => arr.includes(key), fields)

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
}): object => {
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

const buildSearchFieldsObject = (
  schema: SchemaBuilder,
  model: Schema
): QueryObject => {
  const required = getRequiredFields(model)
  const requiredObj = required.reduce(
    (acc, val) => ({ ...acc, [val]: true }),
    {}
  )

  let fields: QueryObject = {}
  fields.id = true
  if (typeof model.displayField === 'string') {
    fields[model.displayField] = true
  }

  fields = R.mergeDeepLeft(requiredObj, fields)

  fields.__typeName = model.modelName

  fields = R.mapObjIndexed((val, key) => {
    const field = schema.getField(model.modelName, key)
    if (!schema.isRel(model.modelName, key) || !field) {
      return val
    }

    const fieldType = field.type as FieldTypeObject

    return buildSearchFieldsObject(
      schema,
      schema.getModel(fieldType.target ?? '')
    )
  }, fields)

  return fields
}

const buildSearchFieldsArray = (schema: SchemaBuilder): object[] => {
  const fieldsArray: object[] = []
  R.forEachObjIndexed((model) => {
    if (schema.getSearchable(model.modelName)) {
      fieldsArray.push(buildSearchFieldsObject(schema, model))
    }
  }, schema.schemaJSON)
  return fieldsArray
}

const buildCascadesObject = (
  schema: SchemaBuilder,
  model: Schema
): QueryObject => {
  const required = getRequiredFields(model)
  const requiredObj = required.reduce(
    (acc, val) => ({ ...acc, [val]: true }),
    {}
  )

  let cascades: QueryObject = {}
  cascades.__typename = true
  cascades.id = true
  if (typeof model.displayField === 'string') {
    cascades[model.displayField] = true
  }

  cascades = R.mergeDeepLeft(requiredObj, cascades)

  cascades.__typeName = model.modelName

  cascades = R.mapObjIndexed((val, key) => {
    const field = schema.getField(model.modelName, key)
    if (!schema.isRel(model.modelName, key) || !field) {
      return val
    }

    const fieldType = field.type as FieldTypeObject

    return buildCascadesObject(schema, schema.getModel(fieldType.target ?? ''))
  }, cascades)

  return cascades
}

const buildDeleteCascadesArray = (schema: SchemaBuilder): object[] => {
  const cascadesArray: object[] = []
  R.forEachObjIndexed((model) => {
    if (model.showDeleteModal !== false)
      cascadesArray.push(buildCascadesObject(schema, model))
  }, schema.schemaJSON)
  return cascadesArray
}

const generatePrepopulatedQuery = ({
  modelName,
  fieldName
}: {
  fieldName: string
  modelName: string
}): string => `{
  result: existingFieldValues(modelName: "${modelName}", fieldName: "${fieldName}")
}`

export const makeQueryBuilder = (schema: SchemaBuilder) => {
  return ({
    modelName,
    fieldName,
    queryType = QueryType.INDEX
  }: {
    modelName: string
    fieldName: string
    queryType: QueryType
  }): object | string => {
    const queryName = getQueryName(schema, modelName, queryType)
    const queryVariables = getVariables({ modelName, queryType })

    // queryName should not be null/undefined
    if (!queryName) {
      return {}
    }

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
      case QueryType.SELECT_EXISTING_FIELDS:
        return generatePrepopulatedQuery({ modelName, fieldName })
      default:
        return { queryType: 'defaultQueryType' }
    }
  }
}
