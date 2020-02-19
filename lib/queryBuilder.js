import _concatInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/concat";
import _defineProperty from "@babel/runtime-corejs3/helpers/esm/defineProperty";
import _reduceInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/reduce";
import _includesInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/includes";
import _Object$assign from "@babel/runtime-corejs3/core-js-stable/object/assign";
import _typeof from "@babel/runtime-corejs3/helpers/esm/typeof";
import * as R from 'ramda';
import { VariableType } from 'json-to-graphql-query';
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

var QueryType = {
  INDEX: 'index',
  DETAIL: 'detail',
  SELECT: 'select',
  TOOLTIP: 'tooltip',
  INDEX_REL: 'indexRelationship',
  DETAIL_REL: 'detailRelationship',
  SELECT_REL: 'selectRelationship',
  SEARCH: 'search',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  DELETE_CASCADES: 'deleteCascades'
}; // begin conveyor util functions

var getField = function getField(schema, modelName, fieldName) {
  return R.pipe(getFields, R.prop(fieldName))(schema, modelName);
};

var getFields = function getFields(schema, modelName) {
  return getModelAttribute(schema, modelName, 'fields');
};

var getModelAttribute = function getModelAttribute(schema, modelName, attributeName) {
  return R.pipe(getModel, R.prop(attributeName))(schema, modelName);
};

var getModel = function getModel(schema, modelName) {
  return R.prop(modelName, schema);
};

var getTooltipFields = function getTooltipFields(schema, modelName) {
  var customProps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  return getShownFields({
    schema: schema,
    modelName: modelName,
    type: 'showTooltip',
    customProps: customProps
  });
};

var getShownFields = function getShownFields(_ref) {
  var schema = _ref.schema,
      modelName = _ref.modelName,
      type = _ref.type,
      node = _ref.node,
      data = _ref.data,
      user = _ref.user,
      customProps = _ref.customProps;
  var fieldOrder = R.prop('fieldOrder', getModel(schema, modelName));
  return R.filter(function (fieldName) {
    var show;

    switch (type) {
      case 'showCreate':
      case 'showDetail':
        show = R.propOr(!R.equals('id', fieldName), type, getField(schema, modelName, fieldName));
        break;

      case 'showIndex':
      case 'showTooltip':
        show = R.propOr(false, type, getField(schema, modelName, fieldName));
        break;

      default:
        show = R.prop(type, getField(schema, modelName, fieldName));
    }

    if (R.type(show) === 'Function') {
      show = show({
        schema: schema,
        modelName: modelName,
        fieldName: fieldName,
        node: node,
        data: data,
        user: user,
        customProps: customProps
      });
    }

    return show;
  }, fieldOrder);
};

var getType = function getType(_ref2) {
  var schema = _ref2.schema,
      modelName = _ref2.modelName,
      fieldName = _ref2.fieldName;
  var field = getField(schema, modelName, fieldName);

  if (isRel(field)) {
    return R.path(['type', 'type'], field);
  }

  return R.prop('type', field);
};

var getSearchable = function getSearchable(schema, modelName) {
  return R.propOr(false, 'searchable', getModel(schema, modelName));
}; // end conveyor util functions


var isRel = function isRel(field) {
  return _typeof(R.prop('type', field)) === 'object';
};

var getRequiredFields = function getRequiredFields(model) {
  return R.union(['__typeName', 'id'], R.pathOr([], ['queryRequired'], model));
};

var getRelTableFields = function getRelTableFields(_ref3) {
  var fieldName = _ref3.fieldName,
      model = _ref3.model;
  return R.pathOr([], ['fields', fieldName, 'type', 'tableFields'], model);
};

var getQueryName = function getQueryName(schema, modelName, queryType) {
  var model = getModel(schema, modelName);

  switch (queryType) {
    case QueryType.INDEX:
    case QueryType.SELECT:
      return model.queryAllName;

    case QueryType.DETAIL:
    case QueryType.TOOLTIP:
      return model.queryName;

    case QueryType.CREATE:
    case QueryType.UPDATE:
    case QueryType.DELETE:
      return R.path([modelName, 'queryName'], schema);

    default:
      return queryType;
  }
};

var getSortVariable = function getSortVariable(modelName) {
  return "".concat(modelName, "Sort");
};

var getListVariables = function getListVariables(modelName) {
  return {
    filter: "".concat(modelName, "Filter"),
    sort: "[".concat(getSortVariable(modelName), "!]")
  };
};

var detailVariables = {
  id: 'Int!'
};

var getVariables = function getVariables(_ref4) {
  var modelName = _ref4.modelName,
      queryType = _ref4.queryType;

  switch (queryType) {
    case QueryType.INDEX:
      return getListVariables(modelName);

    case QueryType.DELETE:
    case QueryType.DETAIL:
    case QueryType.TOOLTIP:
      return detailVariables;

    case QueryType.SELECT:
      return {
        sort: "[".concat(getSortVariable(modelName), "!]")
      };

    case QueryType.SEARCH:
      return {
        queryString: 'String!'
      };

    case QueryType.CREATE:
      return {
        input: "".concat(modelName, "InputRequired!")
      };

    case QueryType.UPDATE:
      return {
        input: "".concat(modelName, "Input!"),
        id: 'Int!'
      };

    case QueryType.DELETE_CASCADES:
      return {
        modelName: 'String!',
        id: 'Int!'
      };
  }
};

var getArgs = function getArgs(queryType) {
  switch (queryType) {
    case QueryType.INDEX:
      return {
        filter: new VariableType('filter'),
        sort: new VariableType('sort')
      };

    case QueryType.DELETE:
    case QueryType.DETAIL:
    case QueryType.TOOLTIP:
      return {
        id: new VariableType('id')
      };

    case QueryType.SELECT:
      return {
        sort: new VariableType('sort')
      };

    case QueryType.SEARCH:
      return {
        queryString: new VariableType('queryString')
      };

    case QueryType.CREATE:
      return {
        input: new VariableType('input')
      };

    case QueryType.UPDATE:
      return {
        input: new VariableType('input'),
        id: new VariableType('id')
      };

    case QueryType.DELETE_CASCADES:
      return {
        tableName: new VariableType('modelName'),
        id: new VariableType('id')
      };
  }
};

var getFieldQueryType = function getFieldQueryType(queryType) {
  switch (queryType) {
    case QueryType.INDEX:
      return QueryType.INDEX_REL;

    case QueryType.DETAIL:
      return QueryType.DETAIL_REL;

    case QueryType.SELECT:
      return QueryType.SELECT_REL;

    default:
      return queryType;
  }
};

var getQueryIndexFields = function getQueryIndexFields(model) {
  var fields = R.pipe(R.prop('fields'), R.map(function (field) {
    return R.prop('showIndex', field) || R.prop('queryIndex', field);
  }))(model);
  return R.filter(R.identity, fields);
};

var getQueryDetailFields = function getQueryDetailFields(model) {
  // fieldName => (true if field.showDetail | false) if non-relationship | Relationship.type
  var fields = R.filter(function (field) {
    return R.propOr(true, 'showDetail', field) || R.prop('queryDetail', field);
  }, R.prop('fields', model));
  return R.mapObjIndexed(function (val, key) {
    // Assume showDetail is true because conveyor assumes it is true
    var show = R.pathOr(true, ['fields', key, 'showDetail'], model) || R.path(['fields', key, 'queryDetail'], model);
    return R.pathOr(show, ['fields', key, 'type', 'type'], model);
  }, fields);
}; // needs to be removed?


var makeRelayNodeConnection = function makeRelayNodeConnection(nodeQueryObj) {
  return _Object$assign({
    __typename: true
  }, nodeQueryObj);
};

var getRelFieldObject = function getRelFieldObject(_ref5) {
  var schema = _ref5.schema,
      modelName = _ref5.modelName,
      fieldName = _ref5.fieldName;
  var relFieldObjet = {
    id: true
  };
  var targetModel = R.path(['type', 'target'], getField(schema, modelName, fieldName));
  var targetModelDisplayField = R.propOr('name', 'displayField', getModel(schema, targetModel));

  if (targetModelDisplayField) {
    relFieldObjet[targetModelDisplayField] = true;
  } // todo: targetModelDisplayField can be function and not string???


  return relFieldObjet;
};

var buildTooltipFieldsObject = function buildTooltipFieldsObject(_ref6) {
  var schema = _ref6.schema,
      modelName = _ref6.modelName;
  var fields = getTooltipFields(schema, modelName);
  return R.pipe(R.reduce(function (accumulator, fieldName) {
    var type = getType({
      schema: schema,
      modelName: modelName,
      fieldName: fieldName
    });

    if (_includesInstanceProperty(type).call(type, 'ToMany')) {
      return R.assoc(fieldName, makeRelayNodeConnection(getRelFieldObject({
        schema: schema,
        modelName: modelName,
        fieldName: fieldName
      })), accumulator);
    } else if (_includesInstanceProperty(type).call(type, 'ToOne')) {
      return R.assoc(fieldName, getRelFieldObject({
        schema: schema,
        modelName: modelName,
        fieldName: fieldName
      }), accumulator);
    } else {
      return R.assoc(fieldName, true, accumulator);
    }
  }, {}))(fields);
};

var pickFields = function pickFields(arr, fields) {
  return R.pickBy(function (val, key) {
    return R.includes(key, arr);
  }, fields);
};

var buildFieldsObject = function buildFieldsObject(_ref7) {
  var schema = _ref7.schema,
      queryType = _ref7.queryType,
      modelName = _ref7.modelName,
      _ref7$queryFields = _ref7.queryFields,
      queryFields = _ref7$queryFields === void 0 ? [] : _ref7$queryFields;
  var model = getModel(schema, modelName);
  var required = getRequiredFields(model);

  var requiredObj = _reduceInstanceProperty(required).call(required, function (acc, val) {
    return _Object$assign({}, acc, _defineProperty({}, val, true));
  }, {});

  if (queryType === QueryType.TOOLTIP) {
    return buildTooltipFieldsObject({
      schema: schema,
      modelName: modelName
    });
  }

  var fields = function () {
    switch (queryType) {
      case QueryType.INDEX:
        return getQueryIndexFields(model);

      case QueryType.DETAIL:
        return getQueryDetailFields(model);

      case QueryType.DETAIL_REL:
        return pickFields(queryFields, getQueryDetailFields(model));

      default:
        return {};
    }
  }();

  fields = R.mergeDeepLeft(requiredObj, fields); // replace with query object when fieldName is Relationship type

  fields = R.mapObjIndexed(function (val, key) {
    var field = getField(schema, modelName, key);

    if (!isRel(field)) {
      return val;
    }

    return buildFieldsObject({
      schema: schema,
      queryType: getFieldQueryType(queryType),
      modelName: R.path(['type', 'target'], field),
      queryFields: getRelTableFields({
        model: model,
        fieldName: key
      })
    });
  }, fields);
  return fields;
};

var buildSearchFieldsArray = function buildSearchFieldsArray(schema) {
  var fieldsArray = [];
  R.forEachObjIndexed(function (model) {
    if (getSearchable(schema, model.modelName)) {
      fieldsArray.push(buildSearchFieldsObject(schema, model));
    }
  }, schema);
  return fieldsArray;
};

var buildSearchFieldsObject = function buildSearchFieldsObject(schema, model) {
  var required = getRequiredFields(model);

  var requiredObj = _reduceInstanceProperty(required).call(required, function (acc, val) {
    return _Object$assign({}, acc, _defineProperty({}, val, true));
  }, {});

  var fields = {};
  fields.id = true;

  if (R.type(model.displayField) === 'String') {
    fields[model.displayField] = true;
  }

  fields = R.mergeDeepLeft(requiredObj, fields);
  fields.__typeName = model.modelName;
  fields = R.mapObjIndexed(function (val, key) {
    var field = getField(schema, model.modelName, key);

    if (!isRel(field)) {
      return val;
    }

    return buildSearchFieldsObject(schema, getModel(schema, R.path(['type', 'target'], field)));
  }, fields);
  return fields;
};

var buildDeleteCascadesArray = function buildDeleteCascadesArray(schema) {
  var cascadesArray = [];
  R.forEachObjIndexed(function (model) {
    cascadesArray.push(buildCascadesObject(schema, model));
  }, schema);
  return cascadesArray;
};

var buildCascadesObject = function buildCascadesObject(schema, model) {
  var required = getRequiredFields(model);

  var requiredObj = _reduceInstanceProperty(required).call(required, function (acc, val) {
    return _Object$assign({}, acc, _defineProperty({}, val, true));
  }, {});

  var cascades = {};
  cascades.__typename = true;
  cascades.id = true;

  if (R.type(model.displayField) === 'String') {
    cascades[model.displayField] = true;
  }

  cascades = R.mergeDeepLeft(requiredObj, cascades);
  cascades.__typeName = model.modelName;
  cascades = R.mapObjIndexed(function (val, key) {
    var field = getField(schema, model.modelName, key);

    if (!isRel(field)) {
      return val;
    }

    return buildCascadesObject(schema, getModel(schema, R.path(['type', 'target'], field)));
  }, cascades);
  return cascades;
};

export var makeQueryBuilder = function makeQueryBuilder(schema) {
  return function (_ref8) {
    var _context, _concatInstanceProper;

    var modelName = _ref8.modelName,
        _ref8$queryType = _ref8.queryType,
        queryType = _ref8$queryType === void 0 ? QueryType.INDEX : _ref8$queryType;
    var queryName = getQueryName(schema, modelName, queryType);
    var queryVariables = getVariables({
      modelName: modelName,
      queryType: queryType
    });

    switch (queryType) {
      case QueryType.INDEX:
      case QueryType.DETAIL:
      case QueryType.SELECT:
      case QueryType.TOOLTIP:
        return {
          query: {
            __variables: queryVariables,
            result: _Object$assign({
              __aliasFor: queryName,
              __args: getArgs(queryType)
            }, buildFieldsObject({
              schema: schema,
              modelName: modelName,
              queryType: queryType
            }))
          }
        };

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
        };

      case QueryType.CREATE:
      case QueryType.UPDATE:
      case QueryType.DELETE:
        return {
          mutation: _defineProperty({
            __variables: queryVariables
          }, _concatInstanceProperty(_context = "".concat(queryType)).call(_context, modelName), (_concatInstanceProper = {
            __args: getArgs(queryType)
          }, _defineProperty(_concatInstanceProper, "".concat(queryName), {
            __typename: true,
            id: true
          }), _defineProperty(_concatInstanceProper, "errors", true), _concatInstanceProper))
        };

      case QueryType.DELETE_CASCADES:
        return {
          query: {
            __variables: queryVariables,
            checkDelete: {
              __args: getArgs(queryType),
              __on: buildDeleteCascadesArray(schema)
            }
          }
        };
    }
  };
};