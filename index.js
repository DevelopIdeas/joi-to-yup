const yup = require('yup')

const domain = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/
const punycode = /^([A-Za-z0-9](?:(?:[-A-Za-z0-9]){0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:(?:[-A-Za-z0-9]){0,61}[A-Za-z0-9])?)*)(\.?)$/
const cyrillicDomain = /^((http|https):\/\/)?[a-zа-я0-9]+([\-\.]{1}[a-zа-я0-9]+)*\.[a-zа-я]{2,5}(:[0-9]{1,5})?(\/.*)?$/i
const patterns = [
  domain,
  punycode,
  cyrillicDomain
];
yup.addMethod(yup.string, 'hostname', function pattern(name, message = 'Invalid Hostname') {
  const domainRules = [patterns.domain, patterns.punycode, patterns.cyrillicDomain];
  return this.test({
    message,
    test: value => (value === null || value === '' || value === undefined) || domainRules.some(regex => regex.test(value)),
  });
});
yup.addMethod(yup.string, 'base64', function pattern(name, message = 'Base64 Invalid') {
  return this.test({
    message,
    test: value => {
      if (!value || value === '' || value.trim() === '') { return false; }
      try {
        return btoa(atob(str)) == str;
      } catch (err) {
        return false;
      }
    }
  });
});
yup.addMethod(yup.array, "unique", function (message='Must be Unique', mapper = (a) => a) {
  return this.test("unique", message, function (list) {
    return list && list.length === new Set(list.map(mapper)).size
  })
})
yup.addMethod(yup.number, "multiple", function (message, mapper = (a) => a) {
  return this.test("multiple", message, function (value) {
    return value && (value % message) === 0
  })
})
yup.addMethod(yup.string, 'alphanum', function pattern(name, message = 'Must be Alpha-Numerical') {
  return this.test({
    message,
    test: value => (value === null || value === '' || value === undefined) || /^[0-9a-zA-Z]+$/.test(value),
  });
});
yup.addMethod(yup.number, "multipleOf", function (message, mapper = (a) => a) {
  return this.test("multipleOf", message, function (value) {
    return value && (value % message) === 0
  })
})
yup.addMethod(yup.string, 'ip', function(message = 'Invalid IP address') {
  return this.matches(/(^(\d{1,3}\.){3}(\d{1,3})$)/, {
    message,
    excludeEmptyString: true
  }).test('ip', message, value => {
    return value === undefined || value.trim() === ''
      ? true
      : value.split('.').find(i => parseInt(i, 10) > 255) === undefined;
  });
})

const createObjectSchema = (jsonProps) => {
  let props = {}
  if (jsonProps) {
    Object.keys(jsonProps).map(key => {
      props[key] = createSchema(jsonProps[key], null, key)
    })
  }
  return yup.object().shape(props)
}

const stringToRegex = (s, m) => {
  const { regex, options } = s
  return (m = regex.match(/^([\/~@;%#'])(.*?)\1([gimsuy]*)$/)) ? new RegExp(m[2], m[3].split('').filter((i, p, s) => s.indexOf(i) === p).join('')) : new RegExp(s);
}

const schemaPropMap = (type, val) => {
  const mapping = {
    items: 'of',
    enum: 'oneOf', 
    description: 'label', 
    minimum: 'min', 
    minLength: 'min', 
    minItems: 'min', 
    exclusiveMinimum: 'min', 
    greater: 'moreThan', 
    less: 'lessThan', 
    maximum: 'max',
    maxLength: 'max',
    maxItems: 'max', 
    exclusiveMaximum: 'max', 
    pattern: 'matches',
    uri: 'url',
    any: 'mixed',
    // lower: 'lowercase',
    // upper: 'uppercase',
    'date-time': 'date',
    examples: null
  }
  // console.log(type, 'type2')
  // console.log(val, 'val2')
  if (mapping[type] === undefined) {
    return type
  } else {
    return mapping[type]
  }
}

const valExtract = (prop, vals) => {
  if (vals) {
    switch (prop) {
      case 'min':
      case 'max':
      case 'length':
      case 'moreThan':
      case 'lessThan':
        return vals.limit
      case 'multiple':
        return vals.base
      case 'uppercase':
      case 'lowercase':
        return vals.direction
      default:
        return vals
    }
  }
  return vals
}

const baseSchemaForProp = (prop, jsonSchema) => {
  switch (prop) {
    case 'integer':
      return yup.number().integer()
    case 'array':
      // console.log(jsonSchema, 'array schema')
      if (jsonSchema.items) {
        const alts = jsonSchema.items.map(j => {
          return createSchema(j, null, prop)
        })
        // console.log(alts, 'alts')
        return yup.array().of(alts[0])
      } else {
        return yup.array().of(createSchema(jsonSchema.items))
      }
    default:
      return yup[prop]()
  }
}

const mapSchemaProps = (jsonSchema, schema, schemaType) => {
  const { flags, rules, allow, matches } = jsonSchema
  // console.log(flags, 'flags')
  // console.log(jsonSchema, 'jsonSchema')
  if (flags) {
    if (flags.presence) {
      switch (flags.presence) {
        case 'required':
          schema = schema.required()
          break
        default:
          console.warn('UNHANDLED PRESENCE: '+flags.presence)
          break
      }
    }
    if (flags.default !== undefined) {
      schema = schema.default(flags.default)
    }
    if (flags.label) {
      schema = schema.label(flags.label)
    }

    // USED BY DATE iso / unix
    // NOT IMPLEMENTED
    if (flags.format) {

    }
    if (Array.isArray(allow)) {
      if (flags && flags.only === true) {
        schema = schema.oneOf(allow)
      } else if (allow.indexOf(null) > -1) {
        schema = schema.nullable(true)
      } else if (Object.keys(flags).length === 1 && flags.default !== undefined) {
      } else {
        console.warn('UNHANDLED ACTION', flags)
      }
    }
  }

  if (rules) {
    rules.map(rule => {
      let { name, args: val }  = rule
      let sPropKey = schemaPropMap(name, val)
      if (sPropKey) {
        let set = false
        switch (sPropKey) {
          case 'matches':
            val = stringToRegex(val)
            break;
          case 'format':
          case 'contentEncoding':
            sPropKey = schemaPropMap(val)
            if (sPropKey === 'date') {
              schema = yup[sPropKey]()
            } else if (val === 'binary') {
            } else {
              schema = schema[schemaPropMap(val)]()
            }
            set = true
            break
          case 'case': {
            const mapping = { lower: 'lowercase', upper: 'uppercase' }
            sPropKey = mapping[val.direction]
          }
            break
          case 'sign': {
            sPropKey = val.sign
            break
          }
        }
        if (!set) {
          let addRule = true
          if (!schema[sPropKey]) {
            console.log('Unsupported Rule')
            console.log(jsonSchema, 'jsonSchema')
            console.log(sPropKey, 'sPropKey2')
            console.log(val, 'val')
            switch (sPropKey) {
              case 'precision':
              case 'sign':
                console.warn(`Unsupported rule ${sPropKey}`)
                addRule = false
                break
            }
          }
          if (addRule) {
            const resVal = valExtract(sPropKey, val)
            schema = schema[sPropKey](resVal)
          }
        }
      }
    })
  }
  if (matches) {
    const matchSchemas = matches.map(match => {
      return createSchema(match.schema)
    })
    schema = schema.test(value => {
      for (let schema of matchSchemas) {
        // console.log(value, 'value')
        // console.log(match, 'match')
        try {
          schema.validateSync(value);
          return true
        } catch (err) {}
      }
      return false
    })
  }
  return schema
}

const createSchema = (jsonSchema, schema, parentKey) => {
  const { type, keys } = jsonSchema
  const propKey = schemaPropMap(type)
  switch (propKey) {
    case 'object':
      schema = createObjectSchema(keys)
      break;
    case 'date':
    case 'string':
    case 'number':
    case 'integer':
    case 'array':
    case 'mixed':
      schema = baseSchemaForProp(propKey, jsonSchema)
      schema = mapSchemaProps(jsonSchema, schema, propKey)
      break;
    case 'alternatives':
      // console.log('alternatives 1')
      schema = yup.mixed()
      schema = mapSchemaProps(jsonSchema, schema, propKey)
      // console.log('alternatives 2')
      break;
    case 'binary':
      if (jsonSchema.flags && jsonSchema.flags.encoding) {
        if (!Array.isArray(jsonSchema.rules)) {
          jsonSchema.rules = []
        }
        jsonSchema.rules.push(jsonSchema.flags.encoding)
        schema = yup.string()
        schema = mapSchemaProps(jsonSchema, schema, propKey)
      }
      break
    default:      
      if (Array.isArray(propKey) && 
        propKey.indexOf('array') > -1 &&
        propKey.indexOf('boolean') > -1 &&
        propKey.indexOf('number') > -1 &&
        propKey.indexOf('object') > -1 &&
        propKey.indexOf('string') > -1 &&
        propKey.indexOf('null') > -1
      ) {
        schema = yup.mixed()
        schema = mapSchemaProps(jsonSchema, schema)
      } else {
        console.log('UNHANDLED RULE TYPE', propKey)
        console.log(parentKey, 'parentKey')
        console.log(propKey, 'propKey')
        console.log(jsonSchema, 'jsonSchema')
  
      }
      break;
  }
  return schema
}

module.exports = {
  createSchema
}