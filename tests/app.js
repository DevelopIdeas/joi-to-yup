const joi = require('joi')
const { createSchema } = require('../index')
const yup = require('yup')

const joiSchema = joi.object().keys({
  nickName: joi.string().required().min(3).max(20).example('鹄思乱想').label('Hero Nickname')
    .regex(/^[a-z]+$/, { name: 'alpha', invert: true }),
  avatar: joi.string().uri().allow(null).default(null),
  email: joi.string().email(),
  ip: joi.string().ip({ version: ['ipv4', 'ipv6'] }),
  hostname: joi.string().hostname().insensitive(),
  gender: joi.string().valid('Male', 'Female', '').default('Female'),
  height: joi.number().positive().greater(0).less(200), // .precision(2)
  birthday: joi.date().iso(),
  birthTime: joi.date().timestamp('unix'),
  skills: joi.array().items(joi.alternatives().try(
    joi.string(),
    joi.object().keys({
      name: joi.string().example('teleport').alphanum().lowercase().required().description('Skill Name'),
      level: joi.number().integer().min(10).max(100).default(50).multiple(20).example(20).description('Skill Level')
    })
  ).required()).min(1).max(3).unique().label('Skills'),
  tags: joi.array().items(joi.string().required()).length(2).required(),
  certificate: joi.binary().encoding('base64').allow(null).default(null).label('Certificate'),
  notes: joi.any().meta({ 'x-supported-lang': ['zh-CN', 'en-US'], deprecated: true })
})

const schema2 = yup.object().shape({
  gender: yup.string().oneOf(['Male', 'Female', '']).default('Male')
})

const main = async () => {
  /*let schema = createSchema(jsonSchema)
  schema.validate({
    avatar: 1,
    gender: 'Male',
    skills: ['jkh']
  }).then(vals => {
    // console.log(vals, 'vals2')
  }).catch(ex => {
    console.log(ex, 'ex2')
  })*/

  const joiDesc = joiSchema.describe()
  console.log(joiDesc, 'joiSchema.describe()')
  let schema = createSchema(joiDesc)

  schema.validate({
    nickName: 'jdjdj',
    avatar: 'http://google.com?hello=world&a=b',
    gender: 'Male',
    skills: ['1','2','3'],
    tags: [1, 2]
    // certificate: null
  }).then(vals => {
    console.log(vals, 'vals2')
  }).catch(ex => {
    console.log(ex, 'ex2')
  })
}
main()